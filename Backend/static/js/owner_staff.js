// =====================================
// OWNER STAFF
// =====================================

document.addEventListener("DOMContentLoaded", () => {

    // =====================================
    // ACTIVE SIDEBAR
    // =====================================

    const menus = document.querySelectorAll(".sidebar-menu a");

    menus.forEach(menu => {

        menu.addEventListener("click", () => {

            menus.forEach(item => {

                item.classList.remove("active");

            });

            menu.classList.add("active");

        });

    });

    // =====================================
    // SEARCH STAFF
    // =====================================

    const searchInput = document.querySelector(".filter-search input");

    const rows = document.querySelectorAll(".attendance-table tbody tr");

    if (searchInput) {

        searchInput.addEventListener("keyup", () => {

            const keyword = searchInput.value.toLowerCase();

            rows.forEach(row => {

                const text = row.innerText.toLowerCase();

                if (text.includes(keyword)) {

                    row.style.display = "";

                } else {

                    row.style.display = "none";

                }

            });

        });

    }

    // =====================================
    // FILTER SHIFT
    // =====================================

    const shiftFilter = document.querySelector(".attendance-filter select");

    if (shiftFilter) {

        shiftFilter.addEventListener("change", () => {

            const value = shiftFilter.value.toLowerCase();

            rows.forEach(row => {

                const shift = row.cells[1].innerText.toLowerCase();

                if (value === "semua shift") {

                    row.style.display = "";

                }

                else if (shift.includes(value.replace(" shift", ""))) {

                    row.style.display = "";

                }

                else {

                    row.style.display = "none";

                }

            });

        });

    }

    // =====================================
    // EDIT STAFF
    // =====================================

    const editButtons = document.querySelectorAll(".edit-btn");

    editButtons.forEach(button => {

        button.addEventListener("click", () => {

            const row = button.closest("tr");

            const staff = row.querySelector("h4").innerText;

            showToast("Edit data " + staff);

        });

    });

    // =====================================
    // PRIMARY BUTTON
    // =====================================

    const primaryButton = document.querySelector(".primary-button");

    if (primaryButton) {

        primaryButton.addEventListener("click", () => {

            showToast("Form tambah staff dibuka.");

        });

    }

        // =====================================
    // REVIEW BUTTON
    // =====================================

    const reviewButtons = document.querySelectorAll(".review-btn");

    reviewButtons.forEach(button => {

        button.addEventListener("click", () => {

            showToast("Membuka halaman persetujuan.");

        });

    });

    // =====================================
    // FLOATING BUTTON
    // =====================================

    const floatingButton = document.querySelector(".floating-button");

    if (floatingButton) {

        floatingButton.addEventListener("click", () => {

            showToast("Tambah staff baru.");

        });

    }

    // =====================================
    // LOAD USER
    // =====================================

    fetch("/api/me", {

        credentials: "include"

    })

    .then(response => response.json())

    .then(result => {

        if (result.success) {

            const fullname = document.getElementById("fullname");
            const role = document.getElementById("role");

            if (fullname) {

                fullname.textContent = result.user.fullname;

            }

            if (role) {

                role.textContent = "Owner";

            }

        }

    })

    .catch(error => {

        console.log(error);

    });

    // =====================================
    // CARD ANIMATION
    // =====================================

    const cards = document.querySelectorAll(".stat-card, .attendance-card, .summary-card, .shift-card, .approval-card");

    cards.forEach((card, index) => {

        card.style.opacity = "0";
        card.style.transform = "translateY(20px)";

        setTimeout(() => {

            card.style.transition = ".45s ease";

            card.style.opacity = "1";
            card.style.transform = "translateY(0px)";

        }, index * 120);

    });

    // =====================================
    // TABLE ROW ANIMATION
    // =====================================

    rows.forEach((row, index) => {

        row.style.opacity = "0";
        row.style.transform = "translateY(12px)";

        setTimeout(() => {

            row.style.transition = ".35s ease";

            row.style.opacity = "1";
            row.style.transform = "translateY(0px)";

        }, 300 + (index * 100));

    });

    // =====================================
    // TOAST
    // =====================================

    function showToast(message) {

        const oldToast = document.querySelector(".toast");

        if (oldToast) {

            oldToast.remove();

        }

        const toast = document.createElement("div");

        toast.className = "toast";

        toast.innerHTML = `

            <i class="bi bi-check-circle-fill"></i>

            <span>${message}</span>

        `;

        document.body.appendChild(toast);

        setTimeout(() => {

            toast.classList.add("show");

        }, 100);

        setTimeout(() => {

            toast.classList.remove("show");

            setTimeout(() => {

                toast.remove();

            }, 300);

        }, 2500);

    }

});