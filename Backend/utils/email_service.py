import os
import requests

from dotenv import load_dotenv


# ==========================
# LOAD ENV
# ==========================

load_dotenv()


RESEND_API_KEY = os.getenv(
    "RESEND_API_KEY"
)


# ==========================
# SEND RESET PASSWORD EMAIL
# ==========================

def send_reset_email(email, token):


    reset_link = (
        f"http://127.0.0.1:5000/reset-password/{token}"
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
            "AMSP Argotelo <onboarding@resend.dev>",


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

        }

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


    return response
