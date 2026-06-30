// ======================================================
// OWNER INVENTORY JS
// ======================================================

document.addEventListener("DOMContentLoaded", () => {

    // ======================================================
    // ACTIVE SIDEBAR
    // ======================================================

    const menus = document.querySelectorAll(".sidebar-menu a");

    menus.forEach(menu => {

        menu.addEventListener("click", () => {

            menus.forEach(item => item.classList.remove("active"));

            menu.classList.add("active");

        });

    });

    // ======================================================
    // SEARCH TABLE
    // ======================================================

    const searchInput = document.querySelector(".search-box input");

    if(searchInput){

        searchInput.addEventListener("keyup",function(){

            const keyword = this.value.toLowerCase();

            const rows = document.querySelectorAll(".inventory-table tbody tr");

            rows.forEach(row=>{

                row.style.display =
                    row.innerText.toLowerCase().includes(keyword)
                    ? ""
                    : "none";

            });

        });

    }

    // ======================================================
    // SORT TABLE
    // ======================================================

    const sortSelect = document.querySelector(".sort-box select");

    if(sortSelect){

        sortSelect.addEventListener("change",function(){

            const tbody = document.querySelector(".inventory-table tbody");

            const rows = Array.from(tbody.querySelectorAll("tr"));

            switch(this.value){

                case "low":

                    rows.sort((a,b)=>{

                        return parseFloat(a.cells[1].innerText)
                        - parseFloat(b.cells[1].innerText);

                    });

                break;

                case "high":

                    rows.sort((a,b)=>{

                        return parseFloat(b.cells[1].innerText)
                        - parseFloat(a.cells[1].innerText);

                    });

                break;

                case "az":

                    rows.sort((a,b)=>{

                        return a.cells[0].innerText.localeCompare(
                            b.cells[0].innerText
                        );

                    });

                break;

            }

            rows.forEach(row=>tbody.appendChild(row));

        });

    }

    // ======================================================
    // EXPORT BUTTON
    // ======================================================

    const exportBtn = document.querySelector(".btn-export");

    if(exportBtn){

        exportBtn.addEventListener("click",()=>{

            alert("Export laporan berhasil.");

        });

    }

    // ======================================================
    // STOK MASUK
    // ======================================================

    const stockBtn = document.querySelector(".btn-stock");

    if(stockBtn){

        stockBtn.addEventListener("click",()=>{

            alert("Menu Stok Masuk.");

        });

    }

    // ======================================================
    // EDIT BUTTON
    // ======================================================

    const editButtons = document.querySelectorAll(".edit-btn");

    editButtons.forEach(button=>{

        button.addEventListener("click",()=>{

            const row = button.closest("tr");

            const nama = row.cells[0].innerText;

            alert("Edit data : " + nama);

        });

    });

    // ======================================================
    // PAGINATION
    // ======================================================

    const pages = document.querySelectorAll(".pagination button");

    pages.forEach(btn=>{

        btn.addEventListener("click",()=>{

            if(btn.querySelector("i")) return;

            pages.forEach(b=>b.classList.remove("active"));

            btn.classList.add("active");

        });

    });

    // ======================================================
    // TOAST
    // ======================================================

    const toast = document.getElementById("stockToast");

    const closeToast = document.getElementById("closeToast");

    if(toast){

        setTimeout(()=>{

            toast.style.display="flex";

        },800);

    }

    if(closeToast){

        closeToast.addEventListener("click",()=>{

            toast.style.display="none";

        });

    }

});