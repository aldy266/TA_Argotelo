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
                .trim()


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




                switch(
                    result.user.role
                ){


                    case "OWNER":


                        window.location.href =
                        "/owner/dashboard";


                        break;




                    case "FINANCE":


                        window.location.href =
                        "/finance/dashboard";


                        break;




                    case "KASIR":


                        window.location.href =
                        "/cashier/dashboard";


                        break;




                    default:


                        alert(
                            "Role tidak dikenali"
                        );


                }



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




            const photoInput =
            document.getElementById(
                "photo"
            );




            if(
                photoInput.files.length > 0
            ){


                formData.append(

                    "photo",

                    photoInput.files[0]

                );


            }





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


    forgotForm.addEventListener(
        "submit",
        async function(e){


            e.preventDefault();



            const email =
            document
            .getElementById("email")
            .value
            .trim();



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