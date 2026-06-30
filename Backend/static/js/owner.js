// ==========================
// DOM LOADED
// ==========================

document.addEventListener("DOMContentLoaded", () => {

    // ==========================
    // SIDEBAR ACTIVE
    // ==========================

    const sidebarMenus = document.querySelectorAll(".sidebar-menu a");

    sidebarMenus.forEach(menu => {

        menu.addEventListener("click", () => {

            sidebarMenus.forEach(item =>
                item.classList.remove("active")
            );

            menu.classList.add("active");

        });

    });


    // ==========================
    // FILTER BUTTON
    // ==========================

    const filters = document.querySelectorAll(".filter-group button");

    filters.forEach(button => {

        button.addEventListener("click", () => {

            filters.forEach(btn =>
                btn.classList.remove("active")
            );

            button.classList.add("active");

        });

    });


    // ==========================
    // CARD ANIMATION
    // ==========================

    const cards = document.querySelectorAll(
        ".stat-card,.card,.transaction-card"
    );

    cards.forEach((card,index)=>{

        card.style.opacity="0";
        card.style.transform="translateY(20px)";

        setTimeout(()=>{

            card.style.transition=".45s ease";

            card.style.opacity="1";
            card.style.transform="translateY(0)";

        },index*120);

    });


    // ==========================
    // SEARCH EFFECT
    // ==========================

    const searchBox=document.querySelector(".search-box");
    const searchInput=document.querySelector(".search-box input");

    if(searchInput){

        searchInput.addEventListener("focus",()=>{

            searchBox.style.border="2px solid #4B2E13";

        });

        searchInput.addEventListener("blur",()=>{

            searchBox.style.border="2px solid transparent";

        });

    }


    // ==========================
    // NOTIFICATION
    // ==========================

    const bell=document.querySelector(".bi-bell-fill");

    if(bell){

        bell.parentElement.addEventListener("click",()=>{

            alert("Anda memiliki 3 notifikasi baru.");

        });

    }


    // ==========================
    // SETTINGS
    // ==========================

    const setting=document.querySelector(".bi-gear-fill");

    if(setting){

        setting.parentElement.addEventListener("click",()=>{

            alert("Pengaturan akan segera tersedia.");

        });

    }


    // ==========================
    // LOGOUT
    // ==========================

    const logout=document.querySelector(".logout");

    if(logout){

        logout.addEventListener("click",(e)=>{

            if(!confirm("Apakah Anda yakin ingin keluar?")){

                e.preventDefault();

            }

        });

    }


    // ==========================
    // FLOATING BUTTON
    // ==========================

    const fab=document.querySelector(".floating-button");

    if(fab){

        fab.addEventListener("click",()=>{

            alert("Tambah data baru");

        });

    }

});