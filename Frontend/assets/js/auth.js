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
// REGISTER VALIDATION
// ==============================

const registerForm = document.getElementById("registerForm");

if (registerForm) {

    registerForm.addEventListener("submit", function (e) {

        e.preventDefault();

        const fullname = document.getElementById("fullname").value.trim();
        const role = document.getElementById("role").value;
        const username = document.getElementById("username").value.trim();
        const password = document.getElementById("password").value.trim();

        if (
            fullname === "" ||
            role === "" ||
            username === "" ||
            password === ""
        ) {

            alert("Please complete all fields.");

            return;

        }

        alert("Frontend Register Success!");

    });

}