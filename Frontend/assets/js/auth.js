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
// LOGIN VALIDATION
// ==============================

const loginForm = document.getElementById("loginForm");

if (loginForm) {

    loginForm.addEventListener("submit", function (e) {

        e.preventDefault();

        const username = document
            .getElementById("username")
            .value
            .trim();

        const password = document
            .getElementById("password")
            .value
            .trim();

        if (username === "" || password === "") {

            alert("Please complete all fields.");

            return;

        }

        alert("Frontend Login Success!");

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

        const response = await fetch("http://127.0.0.1:5000/api/register",{

            method:"POST",

            headers:{
                "Content-Type":"application/json"
            },

            body:JSON.stringify(data)

        });

        const result = await response.json();

        alert(result.message);

        if(result.success){

            window.location.href="login.html";

        }

    });

}