// ======================================================
// AMSP OWNER INVENTORY
// owner_inventory.js
// ======================================================

document.addEventListener("DOMContentLoaded", async () => {

    "use strict";

    // =====================================================
    // DOM ELEMENT
    // =====================================================

    const fullname = document.getElementById("fullname");
    const role = document.getElementById("role");
    const profileImage = document.getElementById("profileImage");

    let loginUser = null;


    const searchBox = document.querySelector(".search-box");
    const searchInput = document.querySelector(".search-box input");


    const inventoryTable =
    document.getElementById("inventoryTable");

    const totalItem =
    document.getElementById("totalItem");

    const stokKritis =
    document.getElementById("stokKritis");


    const pendingPO =
    document.getElementById("pendingPO");

    const stockHistory =
    document.getElementById("stockHistory");

    const viewAllHistory =
    document.getElementById("viewAllHistory");

    const historyModal =
    document.getElementById("historyModal");

    const closeHistoryModal =
    document.getElementById("closeHistoryModal");

    const allHistoryList =
    document.getElementById("allHistoryList");

    const historyStartDate =
    document.getElementById("historyStartDate");

    const historyEndDate =
    document.getElementById("historyEndDate");

    const filterHistoryBtn =
    document.getElementById("filterHistoryBtn");

    

    // =====================================================
    // LIST PURCHASE ORDER MODAL
    // =====================================================

    const pendingCard =
        document.getElementById("pendingCard");


    const listPOModal =
        document.getElementById("listPOModal");


    const closeListPO =
        document.getElementById("closeListPO");


    const poList =
        document.getElementById("poList");

    const sortSelect =
    document.querySelector(".sort-box select");


    // =====================================================
    // EXPORT ELEMENT
    // =====================================================

    const openExportHistory =
        document.getElementById("openExportHistory");


    const exportHistoryModal =
        document.getElementById("exportHistoryModal");


    const closeExportHistory =
        document.getElementById("closeExportHistory");


    const exportStartDate =
        document.getElementById("exportStartDate");


    const exportEndDate =
        document.getElementById("exportEndDate");


    const downloadHistoryBtn =
        document.getElementById("downloadHistoryBtn");

    const cancelExportHistory =
        document.getElementById("cancelExportHistory");



    // =======================
    // OPEN EXPORT HISTORY
    // =======================

    openExportHistory.addEventListener(
        "click",
        ()=>{


            exportMenu.classList.remove(
                "show"
            );


            exportHistoryModal.classList.add(
                "show"
            );


        }
    );



    // =======================
    // CLOSE EXPORT HISTORY
    // =======================

    closeExportHistory.addEventListener(
        "click",
        ()=>{


            exportHistoryModal.classList.remove(
                "show"
            );


        }
    );

    // =======================
    // CANCEL EXPORT HISTORY
    // =======================

    if(cancelExportHistory){


        cancelExportHistory.addEventListener(
            "click",
            ()=>{


                exportHistoryModal.classList.remove(
                    "show"
                );


            }
        );


    }
    // =======================
    // DOWNLOAD HISTORY EXCEL
    // =======================

    downloadHistoryBtn.addEventListener(
        "click",
        ()=>{


            const start =
                exportStartDate.value;


            const end =
                exportEndDate.value;


            if(
                start === "" ||
                end === ""
            ){

                alert(
                    "Pilih tanggal laporan"
                );

                return;

            }


            window.location.href =
            `/api/purchase-orders/export-history?start=${start}&end=${end}`;


        }
    );


    const stockBtn =
    document.querySelector(".btn-stock");



    // =====================================================
    // INVENTORY MODAL
    // =====================================================


    const inventoryModal =
        document.getElementById("inventoryModal");


    const closeInventoryModal =
        document.getElementById("closeInventoryModal");


    const cancelInventory =
        document.getElementById("cancelInventory");


    const saveInventory =
        document.getElementById("saveInventory");



    const namaBahan =
        document.getElementById("namaBahan");


    const jumlahStok =
        document.getElementById("jumlahStok");


    const satuanInput =
        document.getElementById("satuan");


    const minimalStok =
        document.getElementById("minimalStok");


    const supplierInput =
        document.getElementById("supplier");

    // =====================================================
    // PURCHASE ORDER MODAL
    // =====================================================

    const poModal =
        document.getElementById("poModal");


    const closePOModal =
        document.getElementById("closePOModal");


    const cancelPO =
        document.getElementById("cancelPO");


    const savePO =
        document.getElementById("savePO");


    const poInventoryId =
        document.getElementById("poInventoryId");


    const poNamaBahan =
        document.getElementById("poNamaBahan");


    const poJumlah =
        document.getElementById("poJumlah");


    const poSupplier =
        document.getElementById("poSupplier");



    // ===============================
    // EDIT MODE
    // ===============================

    let editMode = false;

    let editId = null;

    const pagination =
        document.getElementById("pagination");

        let inventoryData = [];

        let currentPage = 1;

        const limitPage = 4;



    // =====================================================
    // TOAST
    // =====================================================


    const toast =
        document.getElementById("stockToast");


    const closeToast =
        document.getElementById("closeToast");


    // =====================================================
    // CHECK LOGIN
    // =====================================================

    async function checkLogin(){

        try{

            const response = await fetch("/api/me",{

                credentials:"include"

            });

            const result = await response.json();

            if(!result.success){

                console.log("Login belum terdeteksi");

                return;

            }

            loginUser = result.user;
            
            fullname.textContent =
                result.user.fullname || result.user.username || "User";

            role.textContent =
                result.user.role || "User";

            if(profileImage){

                profileImage.src =
                    result.user.photo || "/static/images/profile.png";

            }

        }

        catch(error){

            console.error(error);

        }
    }

    await checkLogin();


// =====================================================
// LOAD INVENTORY DATABASE
// =====================================================

    async function loadInventory(){


        console.log("LOAD INVENTORY JALAN");


        try{


            const response =
                await fetch(
                    "/api/inventory"
                );


            const result =
                await response.json();



            console.log(result);


            inventoryData =
                result.data;

            // ======================
            // TOTAL ITEM
            // ======================

            if(totalItem){

                totalItem.innerText =
                    inventoryData.length;

            }


            // ======================
            // STOK KRITIS
            // ======================

            let totalKritis = 0;


            inventoryData.forEach(item=>{


                if(
                    Number(item.stok)
                    <=
                    Number(item.minimal_stok)
                ){


                    totalKritis++;


                }


            });


            if(stokKritis){

                stokKritis.innerText =
                    totalKritis;

            }



            renderInventory();


        }


        catch(error){


            console.log(error);


        }


    }



    // =====================================================
    // LOAD PENDING PURCHASE ORDER
    // =====================================================

    async function loadPendingPO(){


        try{


            const response =
                await fetch(
                    "/api/purchase-orders/pending"
                );


            const result =
                await response.json();



            pendingPO.textContent =
                result.total;



        }


        catch(error){


            console.log(error);


        }


    }

    // =====================================================
    // LOAD HISTORY STOCK PO
    // =====================================================

    async function loadHistoryPO(){


        try{


            const response =
                await fetch(
                    "/api/purchase-orders/history"
                );


            const result =
                await response.json();



            stockHistory.innerHTML = "";



            result.data
            .slice(0,2)
            .forEach(item=>{


                stockHistory.innerHTML += `


                <div class="activity-item">


                    <div class="activity-left">


                        <div class="activity-icon green">

                            <i class="bi bi-arrow-down-circle"></i>

                        </div>



                        <div class="activity-info">


                            <h4>

                                ${item.nama_bahan}
                                +
                                ${item.jumlah_order}
                                ${item.satuan}

                            </h4>



                            <p>

                                Update stok masuk dari Supplier
                                ${item.supplier}

                            </p>


                        </div>


                    </div>



                    <div class="activity-right">


                        <strong>

                            ${item.tanggal}

                        </strong>



                        <span>

                            Sistem PO

                        </span>


                    </div>



                </div>


                `;


            });



        }


        catch(error){


            console.log(error);


        }


    }

    // =====================================================
    // VIEW ALL HISTORY STOCK
    // =====================================================

    viewAllHistory.addEventListener(
        "click",
        async(e)=>{


            e.preventDefault();



            const response =
                await fetch(
                    "/api/purchase-orders/history"
                );


            const result =
                await response.json();



            allHistoryList.innerHTML = "";



            result.data.forEach(item=>{


                allHistoryList.innerHTML += `


                <div class="activity-item">


                    <div class="activity-left">


                        <div class="activity-icon green">

                            <i class="bi bi-arrow-down-circle"></i>

                        </div>


                        <div class="activity-info">


                            <h4>

                                ${item.nama_bahan}
                                +
                                ${item.jumlah_order}
                                ${item.satuan}

                            </h4>


                            <p>

                                Supplier :
                                ${item.supplier}

                            </p>


                        </div>


                    </div>


                    <div class="activity-right">


                        <strong>

                            ${item.tanggal}

                        </strong>


                        <span>
                            Sistem PO
                        </span>


                    </div>


                </div>


                `;


            });



            historyModal.classList.add(
                "show"
            );


        }
    );

    // =====================================================
    // CLOSE HISTORY MODAL
    // =====================================================

    if(closeHistoryModal){

        closeHistoryModal.addEventListener(
            "click",
            ()=>{


                historyModal.classList.remove(
                    "show"
                );


            }
        );

    }

    // =====================================================
    // FILTER HISTORY BY DATE
    // =====================================================

    filterHistoryBtn.addEventListener(
        "click",
        async()=>{


            const start =
                historyStartDate.value;


            const end =
                historyEndDate.value;



            if(
                start === "" ||
                end === ""
            ){


                alert(
                    "Pilih tanggal terlebih dahulu"
                );


                return;


            }



            const response =
                await fetch(
                    `/api/purchase-orders/history?start=${start}&end=${end}`
                );



            const result =
                await response.json();



            allHistoryList.innerHTML = "";



            result.data.forEach(item=>{


                allHistoryList.innerHTML += `


                <div class="activity-item">


                    <div class="activity-left">


                        <div class="activity-icon green">

                            <i class="bi bi-arrow-down-circle"></i>

                        </div>


                        <div class="activity-info">


                            <h4>

                                ${item.nama_bahan}
                                +
                                ${item.jumlah_order}
                                ${item.satuan}

                            </h4>


                            <p>

                                Supplier :
                                ${item.supplier}

                            </p>


                        </div>


                    </div>


                    <div class="activity-right">


                        <strong>

                            ${item.tanggal}

                        </strong>


                        <span>

                            Sistem PO

                        </span>


                    </div>


                </div>


                `;


            });


        }
    );

    // =====================================================
    // RENDER INVENTORY
    // =====================================================

    function renderInventory(){


        inventoryTable.innerHTML="";


        const start =
            (currentPage - 1) * limitPage;


        const end =
            start + limitPage;



        const pageData =
            inventoryData.slice(
                start,
                end
            );



        pageData.forEach(item=>{


            let statusText = "";

            let statusClass = "";



            if(
                Number(item.stok)
                <=
                Number(item.minimal_stok)
            ){


                statusText =
                    "Kritis";


                statusClass =
                    "danger";


            }


            else if(
                Number(item.stok)
                <=
                Number(item.minimal_stok) * 2
            ){


                statusText =
                    "Menipis";


                statusClass =
                    "warning";


            }


            else{


                statusText =
                    "Aman";


                statusClass =
                    "safe";


            }



            inventoryTable.innerHTML +=`

            <tr>


                <td>

                    <strong>
                        ${item.nama_bahan}
                    </strong>

                </td>



                <td>

                    ${item.stok}

                    <br>

                    <small>
                        MIN:${item.minimal_stok}
                    </small>

                </td>



                <td>

                    ${item.satuan}

                </td>



                <td>

                    ${item.supplier}

                </td>




                <td>


                    <span class="badge ${statusClass}">

                        ${statusText}

                    </span>


                    ${
                        item.status_po === "PENDING"
                        ?
                        `

                        <br>

                        <span class="badge po-pending">

                            PO Pending

                        </span>

                        `
                        :
                        ""
                    }



                    ${
                        item.status_po === "DIKIRIM"
                        ?
                        `

                        <br>

                        <span class="badge po-send">

                            Dalam Pengiriman

                        </span>

                        `
                        :
                        ""
                    }


                </td>




                <td class="action-cell">


                    <button
                        class="po-btn"

                        data-id="${item.id_inventory}"

                        data-nama="${item.nama_bahan}"

                        data-supplier="${item.supplier}"
                    >

                        <i class="bi bi-cart-plus"></i>

                    </button>



                    <button
                        class="edit-btn"

                        data-id="${item.id_inventory}"

                        data-nama="${item.nama_bahan}"

                        data-stok="${item.stok}"

                        data-satuan="${item.satuan}"

                        data-min="${item.minimal_stok}"

                        data-supplier="${item.supplier}"
                    >

                        <i class="bi bi-pencil"></i>

                    </button>




                    <button
                        class="delete-btn"

                        data-id="${item.id_inventory}"
                    >

                        <i class="bi bi-trash"></i>

                    </button>



                </td>


            </tr>

            `;


        });



        renderPagination();


    }


    // =====================================================
    // RENDER PAGINATION
    // =====================================================

        function renderPagination(){


        pagination.innerHTML = "";


        const totalPage =
            Math.ceil(
                inventoryData.length / limitPage
            );


        // tombol sebelumnya
        const prev =
            document.createElement("button");

        prev.innerHTML =
            `<i class="bi bi-chevron-left"></i>`;


        prev.disabled =
            currentPage === 1;


        prev.onclick = ()=>{

            currentPage--;

            renderInventory();

        };


        pagination.appendChild(prev);



        let startPage =
            Math.max(
                1,
                currentPage - 1
            );


        let endPage =
            Math.min(
                totalPage,
                currentPage + 1
            );



        if(startPage > 1){


            createPageButton(1);


            if(startPage > 2){

                addDots();

            }

        }



        for(
            let i=startPage;
            i<=endPage;
            i++
        ){

            createPageButton(i);

        }



        if(endPage < totalPage){


            if(endPage < totalPage-1){

                addDots();

            }


            createPageButton(totalPage);


        }



        // tombol next
        const next =
            document.createElement("button");


        next.innerHTML =
            `<i class="bi bi-chevron-right"></i>`;


        next.disabled =
            currentPage === totalPage;


        next.onclick = ()=>{

            currentPage++;

            renderInventory();

        };


        pagination.appendChild(next);



        }


        // ==========================
        // CREATE BUTTON PAGE
        // ==========================

        function createPageButton(number){


        const btn =
            document.createElement("button");


        btn.innerText =
            number;


        if(number === currentPage){


            btn.classList.add("active");


        }


        btn.onclick = ()=>{


            currentPage =
                number;


            renderInventory();


        };


        pagination.appendChild(btn);


        }



        // ==========================
        // TITIK ...
        // ==========================

        function addDots(){


        const span =
            document.createElement("span");


        span.innerText =
            "...";


        pagination.appendChild(span);


        }

    // =====================================================
    // OPEN LIST PURCHASE ORDER
    // =====================================================


    pendingCard.addEventListener(
    "click",
    async ()=>{


        const response =
            await fetch(
                "/api/purchase-orders"
            );


        const result =
            await response.json();



        poList.innerHTML = "";



        result.data.forEach(po=>{


            poList.innerHTML += `


            <div class="po-item">


                <div class="po-info">


                    <h4>

                        ${po.nama_bahan}

                    </h4>


                    <p>

                        Jumlah Pesan :
                        <b>
                            ${po.jumlah_order}
                        </b>

                    </p>


                    <p>

                        Supplier :
                        ${po.supplier}

                    </p>


                </div>



                <div class="po-footer">


                    ${
                        po.status === "PENDING"
                        ?
                        `

                        <span class="badge po-pending">

                            PO Pending

                        </span>


                        <button
                            class="po-action-btn send"

                            data-id="${po.id_po}"
                        >

                            Tandai Dikirim

                        </button>

                        `
                        :
                        ""
                    }



                    ${
                        po.status === "DIKIRIM"
                        ?
                        `

                        <span class="badge po-send">

                            Dalam Pengiriman

                        </span>


                        <button
                            class="po-action-btn finish"

                            data-id="${po.id_po}"
                        >

                            Terima Barang

                        </button>

                        `
                        :
                        ""
                    }




                    ${
                        po.status === "SELESAI"
                        ?
                        `

                        <span class="badge safe">

                            Selesai

                        </span>

                        `
                        :
                        ""
                    }


                </div>


            </div>


            `;


        });



        listPOModal.classList.add(
            "show"
        );


    }
    );

    // =====================================================
    // CLOSE LIST PO
    // =====================================================


    closeListPO.addEventListener(
        "click",
        ()=>{


            listPOModal.classList.remove(
                "show"
            );


        }
    );

    // =====================================================
    // UPDATE STATUS PURCHASE ORDER
    // =====================================================


    poList.addEventListener(
        "click",
        async(event)=>{


            const button =
                event.target.closest(
                    ".po-action-btn"
                );


            if(!button){

                return;

            }



            let newStatus = "";



            if(
                button.classList.contains("send")
            ){


                newStatus =
                    "DIKIRIM";


            }



            if(
                button.classList.contains("finish")
            ){


                newStatus =
                    "SELESAI";


            }



            const idPO =
                button.dataset.id;



            const response =
                await fetch(
                    `/api/purchase-orders/${idPO}/status`,
                    {


                        method:"PUT",


                        headers:{

                            "Content-Type":
                            "application/json"

                        },


                        body:
                        JSON.stringify({

                            status:
                                newStatus

                        })


                    }
                );



            const result =
                await response.json();



            if(result.success){


                alert(
                    result.message
                );



                // update tabel inventory
                loadInventory();


                // update angka pending
                loadPendingPO();


                // update history stok
                loadHistoryPO();


                // refresh list PO
                pendingCard.click();


            }


        }
    );
    
    // =====================================================
    // OPEN PURCHASE ORDER MODAL
    // =====================================================


    inventoryTable.addEventListener(
        "click",
        (event)=>{


            const button =
                event.target.closest(".po-btn");


            if(!button){

                return;

            }



            poInventoryId.value =
                button.dataset.id;



            poNamaBahan.value =
                button.dataset.nama;



            poSupplier.value =
                button.dataset.supplier;



            poJumlah.value =
                "";



            poModal.classList.add(
                "show"
            );


        }
    );

    // =====================================================
    // CLOSE PURCHASE ORDER MODAL
    // =====================================================


    function closePO(){


        poModal.classList.remove(
            "show"
        );


    }


    closePOModal?.addEventListener(
        "click",
        closePO
    );


    cancelPO?.addEventListener(
        "click",
        closePO
    );

    // =====================================================
    // SAVE PURCHASE ORDER
    // =====================================================


    savePO.addEventListener(
        "click",
        async ()=>{


            if(
                poJumlah.value === ""
            ){


                alert(
                    "Jumlah pesanan wajib diisi"
                );


                return;


            }



            const data = {


                id_inventory:
                    poInventoryId.value,


                jumlah_order:
                    poJumlah.value,


                supplier:
                    poSupplier.value


            };



            const response =
                await fetch(
                    "/api/purchase-orders",
                    {


                        method:"POST",


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



            if(result.success){


                alert(
                    result.message
                );



                closePO();



                loadInventory();


                loadPendingPO();


            }


        }
    );

    // =====================================================
    // EDIT INVENTORY
    // =====================================================


    inventoryTable.addEventListener(
    "click",
    (event)=>{


        const button =
            event.target.closest(".edit-btn");


        if(!button){

            return;

        }


        editMode = true;


        editId =
            button.dataset.id;



        namaBahan.value =
            button.dataset.nama;


        jumlahStok.value =
            button.dataset.stok;


        satuanInput.value =
            button.dataset.satuan;


        minimalStok.value =
            button.dataset.min;


        supplierInput.value =
            button.dataset.supplier;



        inventoryModal.classList.add(
            "show"
        );


    });

    // =====================================================
    // DELETE INVENTORY
    // =====================================================


    inventoryTable.addEventListener(
    "click",
    async(event)=>{


        const button =
            event.target.closest(".delete-btn");



        if(!button){

            return;

        }



        const id =
            button.dataset.id;



        const confirmDelete =
            confirm(
                "Yakin ingin menghapus data inventory?"
            );



        if(!confirmDelete){

            return;

        }



        const response =
            await fetch(
                `/api/inventory/${id}`,
                {

                    method:"DELETE"

                }
            );



        const result =
            await response.json();




        if(result.success){


            alert(
                result.message
            );


            loadInventory();


        }



    });


    // =====================================================
    // SIDEBAR ACTIVE
    // =====================================================

    const menus =
        document.querySelectorAll(".sidebar-menu a");

    menus.forEach(menu=>{

        menu.addEventListener("click",()=>{

            menus.forEach(item=>{

                item.classList.remove("active");

            });

            menu.classList.add("active");

        });

    });


    // =====================================================
    // SEARCH EFFECT
    // =====================================================

    if(searchBox && searchInput){

        searchInput.addEventListener("focus",()=>{

            searchBox.classList.add("active");

        });

        searchInput.addEventListener("blur",()=>{

            searchBox.classList.remove("active");

        });

    }


    // =====================================================
    // SEARCH TABLE
    // =====================================================

    if(searchInput && inventoryTable){

        searchInput.addEventListener("keyup",function(){

            const keyword =
                this.value.toLowerCase();

            const rows =
                inventoryTable.querySelectorAll("tr");

            rows.forEach(row=>{

                row.style.display =
                    row.innerText
                    .toLowerCase()
                    .includes(keyword)

                    ? ""

                    : "none";

            });

        });

    }


    // =====================================================
    // SORT TABLE
    // =====================================================

    if(sortSelect && inventoryTable){

        sortSelect.addEventListener("change",function(){

            const rows =
                Array.from(
                    inventoryTable.querySelectorAll("tr")
                );

            switch(this.value){

                case "low":

                    rows.sort((a,b)=>{

                        return parseFloat(a.cells[1].innerText)

                        -

                        parseFloat(b.cells[1].innerText);

                    });

                break;

                case "high":

                    rows.sort((a,b)=>{

                        return parseFloat(b.cells[1].innerText)

                        -

                        parseFloat(a.cells[1].innerText);

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

            rows.forEach(row=>{

                inventoryTable.appendChild(row);

            });

        });

    }

    // =====================================================
    // EXPORT DROPDOWN
    // =====================================================

    exportBtn.addEventListener(
        "click",
        (e)=>{


            e.stopPropagation();


            exportMenu.classList.toggle(
                "show"
            );


        }
    );


    // =======================
    // EXPORT INVENTORY NOW
    // =======================

    exportInventoryBtn.addEventListener(
        "click",
        ()=>{


            window.location.href =
            "/api/inventory/export";


        }
    );

    // =====================================================
    // STOK MASUK MODAL
    // =====================================================


    if(stockBtn){

        stockBtn.addEventListener("click",()=>{


        editMode = false;

        editId = null;


        namaBahan.value="";
        jumlahStok.value="";
        satuanInput.value="";
        minimalStok.value="";
        supplierInput.value="";


        inventoryModal.classList.add("show");

    });

    }
    


    function closeInventory(){

        inventoryModal.classList.remove("show");

    }


    closeInventoryModal?.addEventListener(
        "click",
        closeInventory
    );


    cancelInventory?.addEventListener(
        "click",
        closeInventory
    );

    // =====================================================
    // SAVE INVENTORY (CREATE / UPDATE)
    // =====================================================


    saveInventory?.addEventListener(
    "click",
    async ()=>{


        const data = {

            nama_bahan:
                namaBahan.value,


            stok:
                jumlahStok.value,


            satuan:
                satuanInput.value,


            minimal_stok:
                minimalStok.value,


            supplier:
                supplierInput.value

        };



        let url =
            "/api/inventory";


        let method =
            "POST";



        // MODE EDIT

        if(editMode === true){


            url =
            `/api/inventory/${editId}`;


            method =
            "PUT";


        }




        const response =
            await fetch(
                url,
                {

                    method:method,


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




        if(result.success){


            alert(result.message);



            editMode = false;

            editId = null;



            closeInventory();



            loadInventory();


        }



    });


    // =====================================================
    // EDIT BUTTON
    // =====================================================

    const editButtons =
        document.querySelectorAll(".edit-btn");

    editButtons.forEach(button=>{

        button.addEventListener("click",()=>{

            const row =
                button.closest("tr");

            const nama =
                row.cells[0].innerText;

            alert("Edit Data : " + nama);

        });

    });


    // =====================================================
    // TOAST
    // =====================================================

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


    // =====================================================
    // CARD ANIMATION
    // =====================================================

    document.querySelectorAll(

        ".stat-card,.inventory-table-card,.activity-card"

    ).forEach((card,index)=>{

        card.style.opacity="0";

        card.style.transform="translateY(20px)";

        setTimeout(()=>{

            card.style.transition=".35s ease";

            card.style.opacity="1";

            card.style.transform="translateY(0)";

        },index*100);

    });


    // =====================================================
    // HEADER
    // BELL - GEAR - PROFILE
    // =====================================================

    const settingBtn =
        document.getElementById("settingBtn");

    const settingsMenu =
        document.getElementById("settingsMenu");

    const notificationBtn =
        document.getElementById("notificationBtn");

    const notificationMenu =
        document.getElementById("notificationMenu");

    const notificationBadge =
        document.getElementById("notificationBadge");

    const notificationSubtitle =
        document.getElementById("notificationSubtitle");

    const notificationList =
        document.getElementById("notificationList");

    const notificationFooter =
        document.getElementById("notificationFooter");

    const stockAlertText =
        document.getElementById("stockAlertText");

    const viewAllNotification =
        document.getElementById("viewAllNotification");


    let notifications=[];


    // =====================================================
    // MANAGE ACCOUNT MODAL
    // =====================================================

    const manageAccountsBtn =
        document.getElementById("manageAccountsBtn");


    const accountsModal =
        document.getElementById("accountsModal");


    const closeAccountsModal =
        document.getElementById("closeAccountsModal");



    if(manageAccountsBtn){

        manageAccountsBtn.addEventListener(
            "click",
            function(e){

                e.preventDefault();


                settingsMenu.classList.remove(
                    "active"
                );


                accountsModal.classList.add(
                    "show"
                );

            }
        );

    }



    if(closeAccountsModal){

        closeAccountsModal.addEventListener(
            "click",
            function(){

                accountsModal.classList.remove(
                    "show"
                );

            }
        );

    }

        // =====================================================
        // RENDER NOTIFICATION
        // =====================================================

    function renderNotifications(){

        if(!notificationList) return;

        notificationList.innerHTML = "";

        // Badge
        if(notificationBadge){

            notificationBadge.textContent =
                notifications.length;

        }

        // Subtitle
        if(notificationSubtitle){

            notificationSubtitle.textContent =
                notifications.length +
                " Notifikasi Aktif";

        }

        // Tidak ada notifikasi
        if(notifications.length===0){

            notificationList.innerHTML = `

                <div class="notification-empty">

                    <i class="bi bi-check-circle-fill"></i>

                    <span>Tidak ada notifikasi.</span>

                </div>

            `;

            if(notificationFooter){

                notificationFooter.style.display="none";

            }

            return;

        }

        // Maksimal 3 item

        notifications.slice(0,3).forEach(item=>{

            notificationList.innerHTML += `

                <div class="notification-item">

                    <div class="notification-icon">

                        <i class="bi bi-exclamation-triangle-fill"></i>

                    </div>

                    <div class="notification-info">

                        <h5>

                            Stok ${item.product} Menipis

                        </h5>

                        <span>

                            Sisa : ${item.stock}

                        </span>

                        <small>

                            ${item.time}

                        </small>

                    </div>

                </div>

            `;

        });

    if(notificationFooter){

        notificationFooter.style.display="block";

    }

    }


    // =====================================================
    // STOCK ALERT
    // =====================================================

    let alertIndex = 0;

    function rotateStockAlert(){

        if(!stockAlertText) return;

        if(notifications.length===0){

            stockAlertText.textContent =

                "Semua stok aman";

            return;

        }

        stockAlertText.textContent =

            "Stok " +

            notifications[alertIndex].product +

            " menipis";

        alertIndex++;

        if(alertIndex>=notifications.length){

            alertIndex=0;

        }

    }


    renderNotifications();

    rotateStockAlert();

    setInterval(()=>{

        rotateStockAlert();

    },4000);



    // =====================================================
    // SETTINGS
    // =====================================================

    if(settingBtn && settingsMenu){

        settingBtn.addEventListener("click",(e)=>{

            e.stopPropagation();

            if(notificationMenu){

                notificationMenu.classList.remove("active");

            }

            settingsMenu.classList.toggle("active");

        });

    }



    // =====================================================
    // NOTIFICATION
    // =====================================================

    if(notificationBtn && notificationMenu){

        notificationBtn.addEventListener("click",(e)=>{

            e.stopPropagation();

            if(settingsMenu){

                settingsMenu.classList.remove("active");

            }

            notificationMenu.classList.toggle("active");

        });

    }



    // =====================================================
    // CLICK OUTSIDE
    // =====================================================

    document.addEventListener("click",()=>{

        if(settingsMenu){

            settingsMenu.classList.remove("active");

        }

        if(notificationMenu){

            notificationMenu.classList.remove("active");

        }

    });


    if(settingsMenu){

        settingsMenu.addEventListener("click",(e)=>{

            e.stopPropagation();

        });

    }


    if(notificationMenu){

        notificationMenu.addEventListener("click",(e)=>{

            e.stopPropagation();

        });

    }

        // =====================================================
        // ALL NOTIFICATION MODAL
        // =====================================================

    const notificationModal =
        document.getElementById("notificationModal");

    const allNotificationList =
        document.getElementById("allNotificationList");

    const allNotificationCount =
        document.getElementById("allNotificationCount");

    const closeNotificationModal =
        document.getElementById("closeNotificationModal");

    const closeNotificationButton =
        document.getElementById("closeNotificationButton");

    function renderAllNotifications(){

        if(!allNotificationList) return;

        allNotificationList.innerHTML="";

        allNotificationCount.textContent=
            notifications.length + " Notifikasi";

        if(notifications.length===0){

            allNotificationList.innerHTML=`

                <div class="notification-empty">

                    <i class="bi bi-check-circle-fill"></i>

                    <p>Tidak ada notifikasi.</p>

                </div>

            `;

            return;

        }

        notifications.forEach(item=>{

            allNotificationList.innerHTML +=`

                <div class="notification-card">

                    <div class="notification-card-icon">

                        <i class="bi bi-exclamation-triangle-fill"></i>

                    </div>

                    <div class="notification-card-info">

                        <h4>Stok ${item.product} Menipis</h4>

                        <span>Sisa : ${item.stock}</span>

                        <small>${item.time}</small>

                    </div>

                </div>

            `;

        });

    }


    function closeNotification(){

        if(notificationModal){

            notificationModal.classList.remove("show");

        }

    }


    if(viewAllNotification){

        viewAllNotification.addEventListener("click",(e)=>{

            e.preventDefault();

            renderAllNotifications();

            notificationMenu.classList.remove("active");

            notificationModal.classList.add("show");

        });

    }


    if(closeNotificationModal){

        closeNotificationModal.onclick=closeNotification;

    }

    if(closeNotificationButton){

        closeNotificationButton.onclick=closeNotification;

    }


    // =====================================================
    // EDIT PROFILE
    // =====================================================

    const editProfileBtn =
        document.getElementById("editProfileBtn");

    const editProfileModal =
        document.getElementById("editProfileModal");

    const closeProfileModal =
        document.getElementById("closeProfileModal");

    const cancelProfile =
        document.getElementById("cancelProfile");

    const saveProfile =
        document.getElementById("saveProfile");


    function closeProfile(){

        editProfileModal.classList.remove("show");

    }


    if(editProfileBtn){

        editProfileBtn.addEventListener("click",(e)=>{

            e.preventDefault();

            settingsMenu.classList.remove("active");

            if(loginUser){

                document.getElementById("editFullname").value =
                    loginUser.fullname || "";

                document.getElementById("editUsername").value =
                    loginUser.username || "";

                document.getElementById("editEmail").value =
                    loginUser.email || "";

                document.getElementById("editPhone").value =
                    loginUser.phone || "";

                if(previewPhoto){

                    previewPhoto.src =
                        loginUser.photo || "/static/images/profile.png";

                }

            }

            editProfileModal.classList.add("show");

        });

    }


    closeProfileModal?.addEventListener("click",closeProfile);

    cancelProfile?.addEventListener("click",closeProfile);


    saveProfile?.addEventListener("click",async()=>{

        const formData = new FormData();

        const editFullname =
            document.getElementById("editFullname").value.trim();

        const editUsername =
            document.getElementById("editUsername").value.trim();

        if(!editFullname || !editUsername){

            alert("Nama lengkap dan username wajib diisi");

            return;

        }

        formData.append("fullname", editFullname);
        formData.append("username", editUsername);
        formData.append(
            "email",
            document.getElementById("editEmail").value.trim()
        );
        formData.append(
            "phone",
            document.getElementById("editPhone").value.trim()
        );

        if(photoInput?.files?.[0]){

            formData.append("photo", photoInput.files[0]);

        }

        try{

            const response = await fetch("/api/update-profile",{
                method:"POST",
                credentials:"include",
                body:formData
            });

            const result = await response.json();

            alert(result.message);

            if(!result.success){

                return;

            }

            loginUser = {
                ...loginUser,
                ...result.user,
                role: loginUser?.role
            };

            fullname.textContent =
                loginUser.fullname || loginUser.username || "User";

            role.textContent =
                loginUser.role || "User";

            if(profileImage){

                profileImage.src =
                    loginUser.photo || "/static/images/profile.png";

            }

            if(previewPhoto){

                previewPhoto.src =
                    loginUser.photo || "/static/images/profile.png";

            }

            closeProfile();

        }catch(error){

            alert("Profil gagal diperbarui");

        }

    });


    // =====================================================
    // CHANGE PASSWORD
    // =====================================================

    const changePasswordBtn =
        document.getElementById("changePasswordBtn");

    const passwordModal =
        document.getElementById("passwordModal");

    const closePasswordModal =
        document.getElementById("closePasswordModal");

    const cancelPassword =
        document.getElementById("cancelPassword");

    const savePassword =
        document.getElementById("savePassword");


    function closePassword(){

        passwordModal.classList.remove("show");

    }


    changePasswordBtn?.addEventListener("click",(e)=>{

        e.preventDefault();

        settingsMenu.classList.remove("active");

        passwordModal.classList.add("show");

    });


    closePasswordModal?.addEventListener("click",closePassword);

    cancelPassword?.addEventListener("click",closePassword);


    savePassword?.addEventListener("click",async()=>{

        const oldPassword =
            document.getElementById("oldPassword").value;

        const newPassword =
            document.getElementById("newPassword").value;

        const confirmPassword =
            document.getElementById("confirmPassword").value;

        if(!oldPassword || !newPassword){

            alert("Password lama dan password baru wajib diisi");

            return;

        }

        if(newPassword !== confirmPassword){

            alert("Konfirmasi password tidak sama");

            return;

        }

        try{

            const response = await fetch("/api/change-password",{
                method:"POST",
                credentials:"include",
                headers:{
                    "Content-Type":"application/json"
                },
                body:JSON.stringify({
                    old_password:oldPassword,
                    new_password:newPassword
                })
            });

            const result = await response.json();

            alert(result.message);

            if(result.success){

                document.getElementById("oldPassword").value = "";
                document.getElementById("newPassword").value = "";
                document.getElementById("confirmPassword").value = "";

                closePassword();

            }

        }catch(error){

            alert("Password gagal diperbarui");

        }

    });


    // =====================================================
    // PHOTO PREVIEW
    // =====================================================

    const photoInput =
        document.getElementById("photoInput");

    const previewPhoto =
        document.getElementById("previewPhoto");

    photoInput?.addEventListener("change",function(){

        const file=this.files[0];

        if(!file) return;

        const reader=new FileReader();

        reader.onload=function(e){

            previewPhoto.src=e.target.result;

        }

        reader.readAsDataURL(file);

    });


    // =====================================================
    // AUTO REFRESH
    // =====================================================

    async function refreshNotification(){

        try{

            const response =
                await fetch(
                    "/api/notification",
                    {
                        credentials:"include"
                    }
                );

            const result =
                await response.json();

            notifications =
                result.success
                ? result.data
                : [];

        }catch(error){

            console.error(error);

            notifications=[];

        }

        renderNotifications();

        rotateStockAlert();

    }

    setInterval(refreshNotification,10000);


    // =====================================================
    // CLOSE MODAL
    // =====================================================

    window.addEventListener("click",(e)=>{

        if(e.target===notificationModal){

            closeNotification();

        }

        if(e.target===editProfileModal){

            closeProfile();

        }

        if(e.target===passwordModal){

            closePassword();

        }

    });
    

    // =====================================================
    // START LOAD DATA
    // =====================================================

    loadInventory();


    loadPendingPO();


    loadHistoryPO();

    refreshNotification();
    // =====================================================
    // READY
    // =====================================================

    console.log("AMSP OWNER INVENTORY READY");

  
 });
