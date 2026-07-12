// =====================================================
// AMSP OWNER TRANSACTION
// owner_transaction.js
// =====================================================

document.addEventListener("DOMContentLoaded", async () => {

    "use strict";

    // =====================================================
    // DOM
    // =====================================================

    const fullname =
        document.getElementById("fullname");

    const role =
        document.getElementById("role");

    const searchTransaction =
        document.getElementById("searchTransaction");

    const startDate =
        document.getElementById("startDate");

    const endDate =
        document.getElementById("endDate");

    const statusFilter =
        document.getElementById("statusFilter");

    const cashierFilter =
        document.getElementById("cashierFilter");

    const filterBtn =
        document.getElementById("filterBtn");

    const refreshBtn =
        document.getElementById("refreshBtn");

    const transactionTableBody =
        document.getElementById("transactionTableBody");

    const transactionCount =
        document.getElementById("transactionCount");

    const showingData =
        document.getElementById("showingData");

    const totalData =
        document.getElementById("totalData");
    



    // =====================================================
    // CHECK LOGIN
    // =====================================================

    async function checkLogin(){

        try{

            const response =
            await fetch("/api/me",{

                credentials:"include"

            });

            const result =
            await response.json();

            if(!result.success){

                window.location.href="/";

                return;

            }

            fullname.textContent =
            result.user.fullname;

            switch(result.user.role_id){

                case 1:

                    role.textContent="Owner";

                    break;

                case 2:

                    role.textContent="Finance";

                    break;

                case 3:

                    role.textContent="Kasir";

                    break;

                default:

                    role.textContent="User";

            }

        }

        catch(error){

            console.error(error);

            window.location.href="/";

        }

    }

    await checkLogin();



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
    // SEARCH
    // =====================================================

    if(searchTransaction){

        searchTransaction.addEventListener("keyup",()=>{

            renderTransaction();

        });

    }



    // =====================================================
    // FILTER
    // =====================================================

    if(filterBtn){

        filterBtn.addEventListener("click",()=>{

            renderTransaction();

        });

    }



    // =====================================================
    // REFRESH
    // =====================================================

    if(refreshBtn){

        refreshBtn.addEventListener("click",()=>{

            loadTransaction();

        });

    }



    // =====================================================
    // DUMMY DATA
    // =====================================================

    let transactions=[

        {

            id:"ARG-1001",

            date:"03-07-2026",

            customer:"Budi Pratama",

            cashier:"Aldy",

            total:45000,

            payment:"QRIS",

            status:"completed"

        },

        {

            id:"ARG-1002",

            date:"03-07-2026",

            customer:"Siti Nurhaliza",

            cashier:"Aldy",

            total:30000,

            payment:"Cash",

            status:"process"

        },

        {

            id:"ARG-1003",

            date:"03-07-2026",

            customer:"Anto Sugiono",

            cashier:"Rina",

            total:85000,

            payment:"Debit",

            status:"completed"

        }

    ];

        // =====================================================
    // LOAD TRANSACTION
    // =====================================================

    function loadTransaction(){

        /*
        =====================================================

        NANTI BACKEND

        fetch("/api/transaction")

        =====================================================
        */

        renderTransaction();

    }



    // =====================================================
    // FORMAT RUPIAH
    // =====================================================

    function formatRupiah(number){

        return new Intl.NumberFormat("id-ID",{

            style:"currency",

            currency:"IDR",

            minimumFractionDigits:0

        }).format(number);

    }



    // =====================================================
    // RENDER TRANSACTION
    // =====================================================

    function renderTransaction(){

        if(!transactionTableBody) return;

        transactionTableBody.innerHTML="";



        let data=[...transactions];



        // ==========================================
        // SEARCH
        // ==========================================

        if(searchTransaction.value){

            const keyword=

            searchTransaction.value.toLowerCase();

            data=data.filter(item=>

                item.id.toLowerCase().includes(keyword) ||

                item.customer.toLowerCase().includes(keyword) ||

                item.cashier.toLowerCase().includes(keyword)

            );

        }



        // ==========================================
        // STATUS
        // ==========================================

        if(statusFilter.value){

            data=data.filter(item=>

                item.status===statusFilter.value

            );

        }



        // ==========================================
        // KASIR
        // ==========================================

        if(cashierFilter.value){

            data=data.filter(item=>

                item.cashier===cashierFilter.value

            );

        }



        // ==========================================
        // TANGGAL
        // ==========================================

        if(startDate.value && endDate.value){

            data=data.filter(item=>{

                const t=

                item.date.split("-").reverse().join("-");

                return(

                    t>=startDate.value &&

                    t<=endDate.value

                );

            });

        }



        // ==========================================
        // TOTAL
        // ==========================================

        transactionCount.textContent=

        "Total " +

        data.length +

        " Transaksi";



        totalData.textContent=

        data.length;



        if(data.length===0){

            transactionTableBody.innerHTML=`

                <tr>

                    <td colspan="8"

                        style="text-align:center;padding:40px;">

                        Tidak ada transaksi.

                    </td>

                </tr>

            `;

            return;

        }



        showingData.textContent=

        "1 - " +

        data.length;



        // ==========================================
        // TABLE
        // ==========================================

        data.forEach(item=>{

            transactionTableBody.innerHTML += `

            <tr>

                <td>

                    ${item.id}

                </td>

                <td>

                    ${item.date}

                </td>

                <td>

                    ${item.customer}

                </td>

                <td>

                    ${item.cashier}

                </td>

                <td>

                    <strong>

                        ${formatRupiah(item.total)}

                    </strong>

                </td>

                <td>

                    <span class="badge ${item.status}">

                        ${item.status.toUpperCase()}

                    </span>

                </td>

                <td>

                    ${item.payment}

                </td>

                <td>

                    <button

                        class="detail-btn"

                        data-id="${item.id}">

                        <i class="bi bi-eye-fill"></i>

                    </button>

                </td>

            </tr>

            `;

        });



        bindDetailButton();

    }



    // =====================================================
    // LOAD DEFAULT
    // =====================================================

    loadTransaction();

        // =====================================================
    // DETAIL TRANSACTION
    // =====================================================

    const transactionModal =
        document.getElementById("transactionModal");

    const transactionDetail =
        document.getElementById("transactionDetail");

    const closeTransactionModal =
        document.getElementById("closeTransactionModal");

    const closeTransaction =
        document.getElementById("closeTransaction");


    function bindDetailButton(){

        document.querySelectorAll(".detail-btn")

        .forEach(button=>{

            button.addEventListener("click",()=>{

                const id =

                button.dataset.id;

                const trx =

                transactions.find(item=>item.id===id);

                if(!trx) return;

                transactionDetail.innerHTML=`

                    <div class="detail-group">

                        <h4>ID Transaksi</h4>

                        <span>${trx.id}</span>

                    </div>

                    <div class="detail-group">

                        <h4>Tanggal</h4>

                        <span>${trx.date}</span>

                    </div>

                    <div class="detail-group">

                        <h4>Pelanggan</h4>

                        <span>${trx.customer}</span>

                    </div>

                    <div class="detail-group">

                        <h4>Kasir</h4>

                        <span>${trx.cashier}</span>

                    </div>

                    <div class="detail-group">

                        <h4>Total</h4>

                        <span>

                            ${formatRupiah(trx.total)}

                        </span>

                    </div>

                    <div class="detail-group">

                        <h4>Pembayaran</h4>

                        <span>${trx.payment}</span>

                    </div>

                    <div class="detail-group">

                        <h4>Status</h4>

                        <span class="badge ${trx.status}">

                            ${trx.status.toUpperCase()}

                        </span>

                    </div>

                `;

                transactionModal.classList.add("show");

            });

        });

    }



    function closeTransactionFunction(){

        transactionModal.classList.remove("show");

    }



    if(closeTransactionModal){

        closeTransactionModal.onclick=

        closeTransactionFunction;

    }



    if(closeTransaction){

        closeTransaction.onclick=

        closeTransactionFunction;

    }



    window.addEventListener("click",(e)=>{

        if(e.target===transactionModal){

            closeTransactionFunction();

        }

    });



    // =====================================================
    // EXPORT REPORT
    // =====================================================

    const downloadReportBtn =
        document.getElementById("downloadReportBtn");

    const downloadModal =
        document.getElementById("downloadModal");

    const closeDownloadModal =
        document.getElementById("closeDownloadModal");

    const downloadPdf =
        document.getElementById("downloadPdf");

    const downloadExcel =
        document.getElementById("downloadExcel");



    if(downloadReportBtn){

        downloadReportBtn.onclick=()=>{

            downloadModal.classList.add("show");

        };

    }



    if(closeDownloadModal){

        closeDownloadModal.onclick=()=>{

            downloadModal.classList.remove("show");

        };

    }



    if(downloadPdf){

        downloadPdf.onclick=()=>{

            alert("Export PDF akan dihubungkan ke Flask.");

        };

    }



    if(downloadExcel){

        downloadExcel.onclick=()=>{

            alert("Export Excel akan dihubungkan ke Flask.");

        };

    }



    window.addEventListener("click",(e)=>{

        if(e.target===downloadModal){

            downloadModal.classList.remove("show");

        }

    });
    // =====================================================
    // SETTINGS
    // =====================================================

    const settingBtn =
        document.getElementById("settingBtn");

    const settingsMenu =
        document.getElementById("settingsMenu");

    if(settingBtn && settingsMenu){

        settingBtn.addEventListener("click",(e)=>{

            e.stopPropagation();

            settingsMenu.classList.toggle("active");

        });

    }



    // =====================================================
    // NOTIFICATION
    // =====================================================

    const notificationBtn =
        document.getElementById("notificationBtn");

    const notificationMenu =
        document.getElementById("notificationMenu");

    if(notificationBtn && notificationMenu){

        notificationBtn.addEventListener("click",(e)=>{

            e.stopPropagation();

            notificationMenu.classList.toggle("active");

            if(settingsMenu){

                settingsMenu.classList.remove("active");

            }

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
    // LOGOUT
    // =====================================================

    const logoutBtn =
        document.querySelector(".logout");

    if(logoutBtn){

        logoutBtn.addEventListener("click",async(e)=>{

            e.preventDefault();

            if(!confirm("Apakah Anda yakin ingin logout?")){

                return;

            }

            try{

                const response =
                await fetch("/api/logout",{

                    method:"POST",

                    credentials:"include"

                });

                const result =
                await response.json();

                if(result.success){

                    window.location.href="/";

                }

            }

            catch(error){

                console.error(error);

                alert("Logout gagal.");

            }

        });

    }



    // =====================================================
    // AUTO REFRESH
    // =====================================================

    setInterval(()=>{

        loadTransaction();

    },5000);



    // =====================================================
    // READY
    // =====================================================

    console.log("================================");

    console.log("AMSP OWNER TRANSACTION READY");

    console.log("================================");
});