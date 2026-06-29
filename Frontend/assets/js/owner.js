// ==========================
// DOM LOADED
// ==========================

document.addEventListener("DOMContentLoaded", () => {

    // ==========================
    // ACTIVE SIDEBAR MENU
    // ==========================

    const menus = document.querySelectorAll(".sidebar-menu a");

    menus.forEach(menu => {

        menu.addEventListener("click", () => {

            menus.forEach(item => {

                item.classList.remove("active");

            });

            menu.classList.add("active");

        });

    });


    // ==========================
    // CARD ANIMATION
    // ==========================

    const cards = document.querySelectorAll(
        ".stat-card, .card, .transaction-card"
    );

    cards.forEach((card, index) => {

        card.style.opacity = "0";

        card.style.transform = "translateY(20px)";

        setTimeout(() => {

            card.style.transition = "all .5s ease";

            card.style.opacity = "1";

            card.style.transform = "translateY(0)";

        }, index * 150);

    });


    // ==========================
    // SEARCH BOX
    // ==========================

    const searchInput =
        document.querySelector(".search-box input");

    if(searchInput){

        searchInput.addEventListener("focus", () => {

            searchInput.parentElement.style.boxShadow =
                "0 0 0 4px rgba(59,37,18,.1)";

        });

        searchInput.addEventListener("blur", () => {

            searchInput.parentElement.style.boxShadow =
                "0 10px 30px rgba(0,0,0,.08)";

        });

    }


    // ==========================
    // NOTIFICATION BUTTON
    // ==========================

    const notificationButton =
        document.querySelector(".icon-button");

    if(notificationButton){

        notificationButton.addEventListener("click", () => {

            alert(
                "Anda memiliki 3 notifikasi baru."
            );

        });

    }


    // ==========================
    // LOGOUT
    // ==========================

    const logout =
        document.querySelector(".logout");

    if(logout){

        logout.addEventListener("click", (e) => {

            const confirmLogout = confirm(
                "Apakah Anda yakin ingin keluar?"
            );

            if(!confirmLogout){

                e.preventDefault();

            }

        });

    }


    // ==========================
    // FLOATING BUTTON
    // ==========================

    const floatingButton =
        document.querySelector(".floating-button");

    if(floatingButton){

        floatingButton.addEventListener("click", () => {

            alert(
                "Fitur tambah data akan segera tersedia."
            );

        });

    }

});