import os
from pathlib import Path

import requests
from dotenv import load_dotenv


BASE_DIR = Path(__file__).resolve().parents[1]
PROJECT_ROOT = BASE_DIR.parent

# Load root .env first, then Backend/.env. This keeps the email config aligned
# with Backend/config.py no matter where the Flask app is started from.
load_dotenv(PROJECT_ROOT / ".env", override=False)
load_dotenv(BASE_DIR / ".env", override=True)


RESEND_API_KEY = os.getenv(
    "RESEND_API_KEY"
)

RESEND_FROM_EMAIL = os.getenv(
    "RESEND_FROM_EMAIL",
    "AMSP Argotelo <onboarding@resend.dev>"
)

APP_BASE_URL = os.getenv(
    "APP_BASE_URL",
    "http://127.0.0.1:5000"
).rstrip("/")


# ==========================
# SEND RESET PASSWORD EMAIL
# ==========================

def send_reset_email(email, token):
    if not RESEND_API_KEY:
        raise RuntimeError("RESEND_API_KEY belum diisi di file .env")


    reset_link = (
        f"{APP_BASE_URL}/reset-password/{token}"
    )


    response = requests.post(

        "https://api.resend.com/emails",


        headers={

            "Authorization":
            f"Bearer {RESEND_API_KEY}",


            "Content-Type":
            "application/json"

        },


        json={


            "from":
            RESEND_FROM_EMAIL,


            "to":[

                email

            ],


            "subject":
            "Reset Password AMSP",


            "html":
            f"""

            <div style="font-family:Arial">


                <h2>
                    Reset Password AMSP
                </h2>


                <p>
                    Halo,
                    anda meminta reset password akun AMSP.
                </p>


                <p>
                    Klik tombol dibawah untuk membuat password baru.
                </p>


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


                <p>
                    Link berlaku sementara.
                </p>


            </div>

            """

        },

        timeout=15

    )


    # ==========================
    # DEBUG RESEND
    # ==========================

    print(
        "================ EMAIL DEBUG ================"
    )


    print(
        "SEND TO:",
        email
    )


    print(
        "STATUS:",
        response.status_code
    )


    print(
        "RESEND RESPONSE:",
        response.text
    )


    print(
        "============================================="
    )


    if response.status_code >= 400:
        raise RuntimeError(
            f"Email gagal dikirim oleh Resend ({response.status_code}): "
            f"{response.text}"
        )

    return response
