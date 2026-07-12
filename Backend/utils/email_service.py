import os
from pathlib import Path

import requests
from dotenv import load_dotenv


BASE_DIR = Path(__file__).resolve().parents[1]
PROJECT_ROOT = BASE_DIR.parent

# Load root .env first, then Backend/.env. This keeps the email config aligned
# with Backend/config.py no matter where the Flask app is started from.
def _load_email_config():
    load_dotenv(PROJECT_ROOT / ".env", override=False)
    load_dotenv(BASE_DIR / ".env", override=True)

    resend_api_key = os.getenv("RESEND_API_KEY")
    resend_from = (
        os.getenv("RESEND_FROM")
        or os.getenv("RESEND_FROM_EMAIL")
        or "Argotelo <onboarding@resend.dev>"
    )
    app_base_url = (
        os.getenv("APP_BASE_URL")
        or "http://127.0.0.1:5000"
    ).rstrip("/")

    return resend_api_key, resend_from, app_base_url


# ==========================
# SEND RESET PASSWORD EMAIL
# ==========================

def send_reset_email(email, token):
    resend_api_key, resend_from, app_base_url = _load_email_config()

    print("RESEND API KEY LOADED:", bool(resend_api_key))
    print("RESEND FROM:", resend_from)
    print("APP BASE URL:", app_base_url)
    print("RESET EMAIL TARGET:", email)

    if not resend_api_key:
        raise RuntimeError("RESEND_API_KEY belum diisi di file .env")

    reset_link = f"{app_base_url}/reset-password/{token}"
    payload = {
        "from": resend_from,
        "to": [email],
        "subject": "Reset Password AMSP",
        "html": f"""
            <div style="font-family:Arial">
                <h2>Reset Password AMSP</h2>
                <p>Halo, anda meminta reset password akun AMSP.</p>
                <p>Klik tombol dibawah untuk membuat password baru.</p>
                <a href="{reset_link}"
                   style="
                   background:#3B2512;
                   color:white;
                   padding:12px 20px;
                   text-decoration:none;
                   border-radius:8px;
                   ">
                    Reset Password
                </a>
                <br><br>
                <p>Link berlaku sementara.</p>
            </div>
        """
    }

    try:
        with requests.Session() as session:
            session.trust_env = False
            response = session.post(
                "https://api.resend.com/emails",
                headers={
                    "Authorization":
                    f"Bearer {resend_api_key}",
                    "Content-Type":
                    "application/json"
                },
                json=payload,
                timeout=15
            )
    except Exception as error:
        print("RESEND ERROR:", repr(error))
        raise

    print("RESEND STATUS:", response.status_code)

    if response.status_code >= 400:
        print("RESEND ERROR:", repr(response.text))
        raise RuntimeError(
            f"Email gagal dikirim oleh Resend ({response.status_code}): "
            f"{response.text}"
        )

    print("RESET EMAIL SENT:", email)
    return response
