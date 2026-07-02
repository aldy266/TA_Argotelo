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

    loginForm.addEventListener("submit", async function (e) {

        e.preventDefault();

        const data = {

            username: document.getElementById("username").value.trim(),

            password: document.getElementById("password").value.trim()

        };

        const response = await fetch("/api/login",
            {

                method:"POST",

                credentials:"include",

                headers:{
                    "Content-Type":"application/json"
                },

                body:JSON.stringify(data)

            }
        );

        const result = await response.json();

        alert(result.message);

        if (result.success) {

            console.log(result.user);

            switch (result.user.role_id) {

                case 1:
                    window.location.href = "/owner/dashboard";
                    break;

                case 2:
                    window.location.href = "/finance/dashboard";
                    break;

                case 3:
                    window.location.href = "/cashier/dashboard";
                    break;

                default:
                    alert("Role tidak dikenali.");
            }

        }

    });

}

// ==============================
// REGISTER
// ==============================

const registerForm = document.getElementById("registerForm");

if (registerForm) {

    registerForm.addEventListener("submit", async function (e) {

        e.preventDefault();

        const data = {

            fullname: document.getElementById("fullname").value.trim(),

            email: document.getElementById("email").value.trim(),

            phone: document.getElementById("phone").value.trim(),

            username: document.getElementById("username").value.trim(),

            password: document.getElementById("password").value.trim()

        };

        const response = await fetch("/api/register",{

            method:"POST",

            headers:{
                "Content-Type":"application/json"
            },

            body:JSON.stringify(data)

        });

        const result = await response.json();

        alert(result.message);

        if(result.success){

            window.location.href = "/";

        }

    });

}