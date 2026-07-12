// ==============================
// SHOW / HIDE PASSWORD
// ==============================

const togglePassword = document.querySelector(".toggle-password");
const passwordInput = document.querySelector("#password");

if (togglePassword && passwordInput) {

    togglePassword.addEventListener("click", () => {

        const icon = togglePassword.querySelector("i");

        if (passwordInput.type === "password") {

            passwordInput.type = "text";

            icon.classList.remove("bi-eye");
            icon.classList.add("bi-eye-slash");

        } else {

            passwordInput.type = "password";

            icon.classList.remove("bi-eye-slash");
            icon.classList.add("bi-eye");

        }

    });

}

// ==============================
// LOGIN
// ==============================

const loginForm = document.getElementById("loginForm");


if (loginForm) {


    loginForm.addEventListener(
        "submit",
        async function(e){


            e.preventDefault();



            const data = {


                username:
                document
                .getElementById("username")
                .value
                .trim(),



                password:
                document
                .getElementById("password")
                .value
                .trim(),

                login_scope: loginForm.dataset.loginScope || ""


            };




            const response =
            await fetch(
                "/api/login",
                {


                    method:"POST",


                    credentials:"include",


                    headers:{

                        "Content-Type":
                        "application/json"

                    },


                    body:
                    JSON.stringify(data)


                }
            );




            const result =
            await response.json();




            alert(
                result.message
            );




            if(result.success){



                console.log(
                    result.user
                );




                window.location.href = result.user.redirect_url || "/";



            }


        }
    );


}

// ==============================
// REGISTER OWNER
// ==============================

const registerForm =
document.getElementById(
    "registerForm"
);


if(registerForm){


    registerForm.addEventListener(
        "submit",
        async function(e){


            e.preventDefault();



            const formData =
            new FormData();




            formData.append(

                "fullname",

                document
                .getElementById("fullname")
                .value
                .trim()

            );




            formData.append(

                "email",

                document
                .getElementById("email")
                .value
                .trim()

            );




            formData.append(

                "phone",

                document
                .getElementById("phone")
                .value
                .trim()

            );




            formData.append(

                "username",

                document
                .getElementById("username")
                .value
                .trim()

            );




            formData.append(

                "password",

                document
                .getElementById("password")
                .value
                .trim()

            );




            const response =
            await fetch(
                "/api/register-owner",
                {


                    method:"POST",


                    body:formData


                }
            );




            const result =
            await response.json();




            alert(
                result.message
            );




            if(
                result.success
            ){


                window.location.href =
                "/";


            }



        }
    );


}

// ==============================
// FORGOT PASSWORD
// ==============================

const forgotForm =
document.getElementById(
    "forgotForm"
);


if (forgotForm) {

    const forgotMessage =
    document.getElementById(
        "forgotMessage"
    );

    const forgotButton =
    forgotForm.querySelector(
        ".btn-login"
    );

    const setForgotMessage = (message, isError = false) => {

        if (!forgotMessage) return;

        forgotMessage.textContent = message;
        forgotMessage.classList.toggle(
            "error",
            isError
        );
        forgotMessage.classList.toggle(
            "show",
            Boolean(message)
        );

    };

    const isValidEmail = email =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);


    forgotForm.addEventListener(
        "submit",
        async function(e){


            e.preventDefault();



            const email =
            document
            .getElementById("email")
            .value
            .trim();

            setForgotMessage("");

            if (!email) {
                setForgotMessage(
                    "Email wajib diisi.",
                    true
                );
                return;
            }

            if (!isValidEmail(email)) {
                setForgotMessage(
                    "Format email tidak valid.",
                    true
                );
                return;
            }

            if (forgotButton) {
                forgotButton.disabled = true;
                forgotButton.dataset.originalText =
                forgotButton.innerHTML;
                forgotButton.textContent =
                "Mengirim...";
            }


            try {

                const response =
                await fetch(

                "/api/forgot-password",

                {


                    method:"POST",


                    headers:{


                        "Content-Type":
                        "application/json"


                    },


                    body:
                    JSON.stringify({


                        email:email


                    })


                }

                );



                const result =
                await response.json()
                .catch(() => ({
                    success:false,
                    message:"Terjadi kesalahan server"
                }));

                const success =
                response.ok &&
                result.success === true;


                setForgotMessage(
                    result.message ||
                    (
                        success
                        ? "Link reset password berhasil dikirim. Silakan cek email atau folder spam."
                        : "Email reset password belum bisa dikirim. Coba lagi nanti atau hubungi admin."
                    ),
                    !success
                );



            } catch (error) {

                setForgotMessage(
                    "Tidak dapat menghubungi server. Coba lagi sebentar.",
                    true
                );

            } finally {

                if (forgotButton) {
                    forgotButton.disabled = false;
                    forgotButton.innerHTML =
                    forgotButton.dataset.originalText ||
                    "Kirim Reset Link";
                }

            }


        }

    );


}

// ==============================
// RESET PASSWORD
// ==============================

const resetPasswordForm =
document.getElementById(
    "resetPasswordForm"
);


if(resetPasswordForm){


resetPasswordForm.addEventListener(

"submit",

async function(e){


e.preventDefault();



const token =
document
.getElementById("token")
.value;



const password =
document
.getElementById("password")
.value;



const response =
await fetch(

"/api/reset-password",

{

method:"POST",


headers:{


"Content-Type":
"application/json"


},



body:
JSON.stringify({


token:token,


password:password


})


}

);



const result =
await response.json();



alert(
result.message
);



if(result.success){


window.location.href="/";


}


}

);


}
