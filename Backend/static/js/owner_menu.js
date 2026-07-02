// ======================================================
// OWNER MENU MANAGEMENT
// ======================================================

document.addEventListener("DOMContentLoaded", () => {

    // ============================================
    // ACTIVE SIDEBAR BERDASARKAN URL
    // ============================================

    const currentPath = window.location.pathname;
    const menuLinks = document.querySelectorAll(".sidebar-menu a");

    menuLinks.forEach(link => {

        link.classList.remove("active");

        const href = link.getAttribute("href");

        if (href && currentPath === href) {
            link.classList.add("active");
        }

    });


    // ============================================
    // SEARCH MENU
    // ============================================

    const searchInput = document.querySelector(".search-box input");
    const cards = document.querySelectorAll(".menu-card");

    if (searchInput) {

        searchInput.addEventListener("keyup", function () {

            const keyword = this.value.toLowerCase();

            cards.forEach(card => {

                const title = card.querySelector("h3").textContent.toLowerCase();

                if (title.includes(keyword)) {

                    card.style.display = "";

                } else {

                    card.style.display = "none";

                }

            });

        });

    }


    // ============================================
    // DELETE MENU
    // ============================================

    const deleteButtons = document.querySelectorAll(".delete-btn");

    deleteButtons.forEach(button => {

        button.addEventListener("click", function () {

            const confirmDelete = confirm("Yakin ingin menghapus menu ini?");

            if (confirmDelete) {

                const card = this.closest(".menu-card");

                if (card) {

                    card.style.opacity = "0";

                    card.style.transform = "scale(.9)";

                    setTimeout(() => {

                        card.remove();

                    }, 300);

                }

            }

        });

    });


    // ============================================
    // EDIT MENU
    // ============================================

    const editButtons = document.querySelectorAll(".edit-btn");

    editButtons.forEach(button => {

        button.addEventListener("click", function () {

            const nama = this.closest(".menu-card")
                            .querySelector("h3")
                            .textContent;

            alert("Edit Menu : " + nama);

            // nanti diarahkan ke modal/form edit

        });

    });


    // ============================================
    // TAMBAH MENU
    // ============================================

    const addCard = document.querySelector(".add-card");
    const addButton = document.querySelector(".add-menu-btn");

    function tambahMenu(){

        alert("Buka Form Tambah Menu");

        // nanti diarahkan ke modal tambah menu

    }

    if(addCard){

        addCard.addEventListener("click", tambahMenu);

    }

    if(addButton){

        addButton.addEventListener("click", tambahMenu);

    }


    // ============================================
    // PAGINATION (Frontend)
    // ============================================

    const pageButtons = document.querySelectorAll(".page-btn");

    pageButtons.forEach(btn=>{

        btn.addEventListener("click",function(){

            pageButtons.forEach(b=>b.classList.remove("active"));

            if(!this.querySelector("i")){

                this.classList.add("active");

            }

        });

    });


    // ============================================
    // HOVER EFFECT
    // ============================================

    cards.forEach(card=>{

        card.addEventListener("mouseenter",()=>{

            card.style.transition=".35s";

        });

    });

});