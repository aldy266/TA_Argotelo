// =====================================================
// AMSP OWNER DASHBOARD
// owner_dashboard.js
// =====================================================

document.addEventListener("DOMContentLoaded", async () => {

    "use strict";

    // =====================================================
    // DOM ELEMENT
    // =====================================================

    const fullname = document.getElementById("fullname");
    const role = document.getElementById("role");
    const profileImage = document.getElementById("profileImage");

    const todayBtn = document.getElementById("todayBtn");
    const weekBtn = document.getElementById("weekBtn");
    const monthBtn = document.getElementById("monthBtn");

    const startDate = document.getElementById("startDate");
    const endDate = document.getElementById("endDate");
    const filterBtn = document.getElementById("filterBtn");

    const dashboardPeriod =
        document.getElementById("dashboard-period");

    const salesValue =
        document.getElementById("salesValue");

    const salesInfo =
        document.getElementById("salesInfo");

    const transactionValue =
        document.getElementById("transactionValue");

    const transactionInfo =
        document.getElementById("transactionInfo");

    const incomeValue =
        document.getElementById("incomeValue");

    const incomeInfo =
        document.getElementById("incomeInfo");

    const attendanceValue =
        document.getElementById("attendanceValue");

    const attendanceInfo =
        document.getElementById("attendanceInfo");
    // =====================================================
    // CURRENT FILTER
    // =====================================================

    let loginUser = null;

    let currentFilter = "today";


    // =====================================================
    // CHECK LOGIN
    // =====================================================

    async function checkLogin() {

        try {

            const response = await fetch("/api/me", {

                credentials: "include"

            });

            const result = await response.json();

            loginUser = result.user;

            if (!result.success) {

                window.location.href = "/";

                return;

            }

            fullname.textContent =
                result.user.fullname;

            if(profileImage){

                if(result.user.photo){


                    profileImage.src =
                    result.user.photo;

                    const previewPhoto =
                    document.getElementById("previewPhoto");


                    if(previewPhoto){


                        previewPhoto.src =
                        result.user.photo;


                    }


                }else{


                    profileImage.src =
                    "/static/images/default.png";


                }


            }

            switch (result.user.role_id) {

                case 1:

                    role.textContent = "Owner";

                    break;

                case 2:

                    role.textContent = "Finance";

                    break;

                case 3:

                    role.textContent = "Kasir";

                    break;

                default:

                    role.textContent = "User";

            }

        }

        catch (error) {

            console.error(error);

            window.location.href = "/";

        }

    }

    await checkLogin();



    // =====================================================
    // SIDEBAR ACTIVE
    // =====================================================

    const menus =
        document.querySelectorAll(".sidebar-menu a");

    menus.forEach(menu => {

        menu.addEventListener("click", () => {

            menus.forEach(item => {

                item.classList.remove("active");

            });

            menu.classList.add("active");

        });

    });

        // =====================================================
    // DASHBOARD FILTER
    // =====================================================

    function setActiveButton(button){

        [todayBtn, weekBtn, monthBtn].forEach(btn=>{

            if(btn){

                btn.classList.remove("active");

            }

        });

        if(button){

            button.classList.add("active");

        }

    }


    if(todayBtn){

        todayBtn.addEventListener("click",()=>{

            setActiveButton(todayBtn);

            dashboardPeriod.textContent =
            "Selamat datang kembali. Berikut adalah performa kedai hari ini.";

            currentFilter = "today";

            loadDashboard(currentFilter);

        });

    }


    if(weekBtn){

        weekBtn.addEventListener("click",()=>{

            setActiveButton(weekBtn);

            dashboardPeriod.textContent =
            "Berikut performa operasional selama minggu ini.";

            currentFilter = "week";

            loadDashboard(currentFilter);

        });

    }


    if(monthBtn){

        monthBtn.addEventListener("click",()=>{

            setActiveButton(monthBtn);

            dashboardPeriod.textContent =
            "Berikut performa operasional selama bulan ini.";

            currentFilter = "month";

            loadDashboard(currentFilter);

        });

    }



    // =====================================================
    // FILTER TANGGAL
    // =====================================================

    if(filterBtn){

        filterBtn.addEventListener("click",()=>{

            if(!startDate.value || !endDate.value){

                alert("Silakan pilih tanggal terlebih dahulu.");

                return;

            }

            dashboardPeriod.textContent =
            `Periode ${startDate.value} sampai ${endDate.value}`;

            currentFilter = "custom";

            loadDashboard(

                currentFilter,

                startDate.value,

                endDate.value

            );
        });

    }

    
    // =====================================================
    // LOAD DASHBOARD
    // =====================================================

    async function loadDashboard(filter, start = "", end = "") {

        try {

            const response = await fetch("/api/dashboard", {

                method: "POST",

                headers: {

                    "Content-Type": "application/json"

                },

                body: JSON.stringify({

                    filter: filter,

                    start_date: start,

                    end_date: end

                })

            });

            const result = await response.json();

            if(result.success){

                // Nanti jika backend sudah selesai
                // data akan diambil dari API

                // updateStatistics(result.statistics);
                // topProducts = result.top_products;
                // renderTopProduct();

            }else{

                // Sementara gunakan data dummy

                updateStatistics(filter);

                renderTopProduct();

                renderNotifications();

            }

            updateTransactionTime();

        }

        catch(error){

            console.warn("API Dashboard belum tersedia.");

            // Tetap tampilkan data dummy

            updateStatistics(filter);

            renderTopProduct();

            renderNotifications();

            updateTransactionTime();

        }

    }

    // Refresh otomatis setiap 5 detik
    setInterval(() => {

        loadDashboard(currentFilter, startDate.value, endDate.value);

    }, 5000);


    // =====================================================
    // UPDATE STATISTICS
    // =====================================================

    function updateStatistics(filter){

        const data={

            today:{

                sales:"Rp 4.250.000",

                transaction:"128",

                income:"Rp 4.250.000",

                attendance:"8 / 10",

                salesInfo:"Hari Ini",

                transactionInfo:"Hari Ini",

                incomeInfo:"Pendapatan Hari Ini",

                attendanceInfo:"80% Kehadiran"

            },

            week:{

                sales:"Rp 27.850.000",

                transaction:"842",

                income:"Rp 27.850.000",

                attendance:"9 / 10",

                salesInfo:"Minggu Ini",

                transactionInfo:"Minggu Ini",

                incomeInfo:"Pendapatan Minggu Ini",

                attendanceInfo:"90% Kehadiran"

            },

            month:{

                sales:"Rp 118.500.000",

                transaction:"3.524",

                income:"Rp 118.500.000",

                attendance:"10 / 10",

                salesInfo:"Bulan Ini",

                transactionInfo:"Bulan Ini",

                incomeInfo:"Pendapatan Bulan Ini",

                attendanceInfo:"100% Kehadiran"

            },

            custom:{

                sales:"Rp 58.750.000",

                transaction:"1.456",

                income:"Rp 58.750.000",

                attendance:"9 / 10",

                salesInfo:"Periode Dipilih",

                transactionInfo:"Periode Dipilih",

                incomeInfo:"Periode Dipilih",

                attendanceInfo:"Periode Dipilih"

            }

        };

        const item=data[filter];

        if(!item) return;

        salesValue.textContent=item.sales;
        salesInfo.textContent=item.salesInfo;

        transactionValue.textContent=item.transaction;
        transactionInfo.textContent=item.transactionInfo;

        incomeValue.textContent=item.income;
        incomeInfo.textContent=item.incomeInfo;

        attendanceValue.textContent=item.attendance;
        attendanceInfo.textContent=item.attendanceInfo;

    }



    // =====================================================
    // SEARCH EFFECT
    // =====================================================

    const searchBox=
    document.querySelector(".search-box");

    const searchInput=
    document.querySelector(".search-box input");

    if(searchBox && searchInput){

        searchInput.addEventListener("focus",()=>{

            searchBox.classList.add("active");

        });

        searchInput.addEventListener("blur",()=>{

            searchBox.classList.remove("active");

        });

    }



    // =====================================================
    // CARD ANIMATION
    // =====================================================

    document.querySelectorAll(

        ".stat-card,.card,.transaction-card"

    ).forEach((card,index)=>{

        card.style.opacity="0";

        card.style.transform="translateY(20px)";

        setTimeout(()=>{

            card.style.transition=".4s ease";

            card.style.opacity="1";

            card.style.transform="translateY(0)";

        },index*100);

    });

        // =====================================================
    // SETTINGS & NOTIFICATION
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

    const viewAllNotification =
        document.getElementById("viewAllNotification");

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



    // =====================================================
    // DUMMY DATA
    // =====================================================

    let notifications = [

        {
            id:1,
            product:"Singkong",
            stock:"4 Kg",
            time:"2 menit lalu"
        },

        {
            id:2,
            product:"Keju",
            stock:"5 Kg",
            time:"8 menit lalu"
        },

        {
            id:3,
            product:"Coklat",
            stock:"2 Kg",
            time:"15 menit lalu"
        },

        {
            id:4,
            product:"Mozarella",
            stock:"3 Kg",
            time:"20 menit lalu"
        }

    ];



    // =====================================================
    // RENDER NOTIFICATION
    // =====================================================

    function renderNotifications(){

        if(!notificationList) return;

        notificationList.innerHTML="";

        if(notificationBadge){

            notificationBadge.textContent =
            notifications.length;

        }

        if(notificationSubtitle){

            notificationSubtitle.textContent =

            notifications.length +

            " Notifikasi Aktif";

        }

        if(notifications.length===0){

            notificationList.innerHTML=`

                <div class="notification-empty">

                    <i class="bi bi-check-circle-fill"></i>

                    <span>

                        Tidak ada notifikasi.

                    </span>

                </div>

            `;

            if(notificationFooter){

                notificationFooter.style.display="none";

            }

            return;

        }

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

            notificationFooter.style.display =

            notifications.length>3

            ? "block"

            : "none";

        }

    }

    renderNotifications();

        function renderAllNotifications(){

        if(!allNotificationList) return;

        allNotificationList.innerHTML="";

        allNotificationCount.textContent=

        notifications.length+

        " Notifikasi";

        if(notifications.length===0){

            allNotificationList.innerHTML=`

                <div class="notification-empty">

                    <i class="bi bi-check-circle-fill"></i>

                    <p>Tidak ada stok menipis.</p>

                </div>

            `;

            return;

        }

        notifications.forEach(item=>{

            allNotificationList.innerHTML+=`

            <div class="notification-card">

                <div class="notification-card-icon">

                    <i class="bi bi-exclamation-triangle-fill"></i>

                </div>

                <div class="notification-card-info">

                    <h4>

                        Stok ${item.product} Menipis

                    </h4>

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

    }

        // =====================================================
    // GEAR CLICK
    // =====================================================

    if (settingBtn && settingsMenu) {

        settingBtn.addEventListener("click", function (e) {

            e.stopPropagation();

            if (notificationMenu) {

                notificationMenu.classList.remove("active");

            }

            settingsMenu.classList.toggle("active");

        });

    }



    // =====================================================
    // NOTIFICATION CLICK
    // =====================================================

    if (notificationBtn && notificationMenu) {

        notificationBtn.addEventListener("click", function (e) {

            e.stopPropagation();

            if (settingsMenu) {

                settingsMenu.classList.remove("active");

            }

            notificationMenu.classList.toggle("active");

        });

    }



    // =====================================================
    // STOP PROPAGATION
    // =====================================================

    if (settingsMenu) {

        settingsMenu.addEventListener("click", function (e) {

            e.stopPropagation();

        });

    }

    if (notificationMenu) {

        notificationMenu.addEventListener("click", function (e) {

            e.stopPropagation();

        });

    }



    // =====================================================
    // CLICK OUTSIDE
    // =====================================================

    document.addEventListener("click", function () {

        if (settingsMenu) {

            settingsMenu.classList.remove("active");

        }

        if (notificationMenu) {

            notificationMenu.classList.remove("active");

        }

    });



    // =====================================================
    // VIEW ALL NOTIFICATION
    // =====================================================

    if(viewAllNotification){

        viewAllNotification.addEventListener("click",(e)=>{

            e.preventDefault();

            renderAllNotifications();

            notificationMenu.classList.remove("active");

            notificationModal.classList.add("show");

        });

    }


    // =====================================================
    // STOCK ALERT
    // =====================================================

    const stockAlertText =
        document.getElementById("stockAlertText");

    let stockIndex = 0;

    function rotateAlert() {

        if (!stockAlertText) return;

        if (notifications.length === 0) {

            stockAlertText.textContent =
                "Semua stok aman.";

            return;

        }

        stockAlertText.textContent =

            "Stok " +

            notifications[stockIndex].product +

            " Menipis";

        stockIndex++;

        if (stockIndex >= notifications.length) {

            stockIndex = 0;

        }

    }

    rotateAlert();

    setInterval(rotateAlert, 4000);

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


    function closeProfileModalFunction(){

        if(editProfileModal){

            editProfileModal.classList.remove("show");

        }

    }


    if(editProfileBtn){


        editProfileBtn.addEventListener("click",(e)=>{


            e.preventDefault();


            if(settingsMenu){


                settingsMenu.classList.remove("active");


            }


            document.getElementById("editFullname").value =
            loginUser.fullname;


            document.getElementById("editUsername").value =
            loginUser.username;


            document.getElementById("editEmail").value =
            loginUser.email;


            document.getElementById("editPhone").value =
            loginUser.phone;



            if(loginUser.photo){


                previewPhoto.src =
                loginUser.photo;


            }



            editProfileModal.classList.add("show");


        });


    }


    if(closeProfileModal){

        closeProfileModal.addEventListener("click",()=>{

            closeProfileModalFunction();

        });

    }


    if(cancelProfile){

        cancelProfile.addEventListener("click",()=>{

            closeProfileModalFunction();

        });

    }


    if(saveProfile){


    saveProfile.addEventListener(
        "click",
        async()=>{


            const formData =
            new FormData();


            formData.append(
                "fullname",
                document.getElementById("editFullname").value
            );


            formData.append(
                "username",
                document.getElementById("editUsername").value
            );


            formData.append(
                "email",
                document.getElementById("editEmail").value
            );


            formData.append(
                "phone",
                document.getElementById("editPhone").value
            );


            const photo =
            document.getElementById("photoInput").files[0];


            if(photo){


                formData.append(
                    "photo",
                    photo
                );


            }



            const response =
            await fetch(
                "/api/update-profile",
                {

                    method:"POST",

                    credentials:"include",

                    body:formData

                }
            );


            const result =
            await response.json();



            alert(
                result.message
            );



            if(result.success){


                // update data cache JS
                loginUser.fullname =
                result.user.fullname;


                loginUser.username =
                result.user.username;


                loginUser.email =
                result.user.email;


                loginUser.phone =
                result.user.phone;


                loginUser.photo =
                result.user.photo;



                // update tampilan header
                fullname.textContent =
                result.user.fullname;



                if(result.user.photo){


                    profileImage.src =
                    result.user.photo;


                    previewPhoto.src =
                    result.user.photo;


                }



                closeProfileModalFunction();


            }


        }
    );


}

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


    function closePasswordModalFunction(){

        if(passwordModal){

            passwordModal.classList.remove("show");

        }

    }


    if(changePasswordBtn){

        changePasswordBtn.addEventListener("click",(e)=>{

            e.preventDefault();

            if(settingsMenu){

                settingsMenu.classList.remove("active");

            }

            passwordModal.classList.add("show");

        });

    }


    if(closePasswordModal){

        closePasswordModal.addEventListener("click",()=>{

            closePasswordModalFunction();

        });

    }


    if(cancelPassword){

        cancelPassword.addEventListener("click",()=>{

            closePasswordModalFunction();

        });

    }


if(savePassword){


    savePassword.addEventListener(
        "click",
        async()=>{


            const oldPassword =
            document.getElementById(
                "oldPassword"
            ).value;


            const newPassword =
            document.getElementById(
                "newPassword"
            ).value;


            const confirmPassword =
            document.getElementById(
                "confirmPassword"
            ).value;



            if(newPassword !== confirmPassword){


                alert(
                    "Konfirmasi password tidak sama"
                );


                return;

            }



            const response =
            await fetch(
                "/api/change-password",
                {

                    method:"POST",

                    credentials:"include",

                    headers:{

                        "Content-Type":
                        "application/json"

                    },


                    body:JSON.stringify({

                        old_password:
                        oldPassword,


                        new_password:
                        newPassword

                    })

                }
            );



            const result =
            await response.json();



            alert(
                result.message
            );



            if(result.success){


                closePasswordModalFunction();


            }


        }
    );


}



    // =====================================================
    // CLOSE MODAL
    // =====================================================

    window.addEventListener("click",(e)=>{

        if(editProfileModal &&
            e.target===editProfileModal){

            closeProfileModalFunction();

        }

        if(passwordModal &&
            e.target===passwordModal){

            closePasswordModalFunction();

        }

        if(notificationModal &&
            e.target===notificationModal){

            closeNotification();

        }

    });

    function closeNotification(){

    notificationModal.classList.remove("show");

        }

        if(closeNotificationModal){

            closeNotificationModal.onclick=

            closeNotification;

        }

        if(closeNotificationButton){

            closeNotificationButton.onclick=

            closeNotification;

        }



    // =====================================================
    // PHOTO PREVIEW
    // =====================================================

    const photoInput =
        document.getElementById("photoInput");

    const previewPhoto =
        document.getElementById("previewPhoto");


    if(photoInput){

        photoInput.addEventListener("change",function(){

            const file=this.files[0];

            if(!file) return;

            const reader=new FileReader();

            reader.onload=function(e){

                previewPhoto.src=e.target.result;

            }

            reader.readAsDataURL(file);

        });

    }



    // =====================================================
    // FLOATING BUTTON
    // =====================================================

    const floatingButton =
        document.querySelector(".floating-button");

    if(floatingButton){

        floatingButton.addEventListener("click",()=>{

            console.log("Floating Button Click");

        });

    }

    // =====================================================
    // TRANSACTION
    // =====================================================

    const historyBtn =
    document.getElementById("historyBtn");

    const downloadReportBtn =
    document.getElementById("downloadReportBtn");

    const transactionUpdateTime =
    document.getElementById("transactionUpdateTime");

    // =====================================================
    // LOAD DEFAULT
    // =====================================================

    loadDashboard("today");
    rotateAlert();



    // =====================================================
    // LOGOUT
    // =====================================================

    const logoutBtn =
        document.querySelector(".logout");

    if(logoutBtn){

        logoutBtn.addEventListener("click",async(e)=>{

            e.preventDefault();

            const confirmLogout=

            confirm("Apakah Anda yakin ingin logout?");

            if(!confirmLogout){

                return;

            }

            try{

                const response=await fetch("/api/logout",{

                    method:"POST",

                    credentials:"include"

                });

                const result=await response.json();

                if(result.success){

                    window.location.href="/";

                }else{

                    alert(result.message);

                }

            }catch(error){

                console.error(error);

                alert("Logout gagal.");

            }

        });

    }



    // =====================================================
    // REALTIME NOTIFICATION
    // =====================================================

    async function refreshNotification(){

        /*
        =====================================================

        NANTI DIGANTI API FLASK

        const response = await fetch("/api/notification");

        const result = await response.json();

        notifications = result.data;

        =====================================================
        */

        renderNotifications();

    }



    // =====================================================
    // AUTO REFRESH
    // =====================================================

    setInterval(()=>{

        refreshNotification();

    },10000);



    // =====================================================
    // DASHBOARD READY
    // =====================================================

    console.log("====================================");

    console.log("AMSP OWNER DASHBOARD READY");

    console.log("====================================");

});

// =====================================
// TOP PRODUCT
// =====================================

const topProducts = [

    {

        name:"Singkong 3 Rasa",

        variant:"Keju, Coklat, Hot Mayo",

        total:85,

        status:"+12%",

        class:"up",

        image:"/static/images/menu1.png"

    },

    {

        name:"Getuk Krispi",

        variant:"Original",

        total:62,

        status:"+5%",

        class:"up",

        image:"/static/images/menu2.png"

    },

    {

        name:"Gemblong Lumer",

        variant:"Keju, Coklat, Kopi, Durian",

        total:48,

        status:"Stabil",

        class:"stable",

        image:"/static/images/menu3.png"

    },

    {

        name:"Telo Keju",

        variant:"Keju Mozarella",

        total:40,

        status:"-3%",

        class:"down",

        image:"/static/images/menu4.png"

    }

];

function renderTopProduct(){

    const list = document.getElementById("topProductList");

    if(!list) return;

    list.innerHTML="";

    topProducts.forEach(item=>{

        list.innerHTML += `

        <div class="product-item">

            <img src="${item.image}" alt="${item.name}">

            <div class="product-info">

                <h4>${item.name}</h4>

                <span>${item.variant}</span>

            </div>

            <div class="product-total">

                <h5>${item.total} Porsi</h5>

                <span class="${item.class}">

                    ${item.status}

                </span>

            </div>

        </div>

        `;

    });

}

// =====================================================
// UPDATE TIME
// =====================================================

function updateTransactionTime(){

    const now = new Date();

    const hour = String(now.getHours()).padStart(2,"0");

    const minute = String(now.getMinutes()).padStart(2,"0");

    transactionUpdateTime.textContent =

    "Terakhir diperbarui : " +

    hour +

    ":" +

    minute;

}

updateTransactionTime();

setInterval(updateTransactionTime,60000);

// =====================================================
// HISTORY
// =====================================================

const historyButton =
document.getElementById(
    "historyBtn"
);


if(historyButton){


    historyButton.addEventListener(
        "click",
        () => {


            console.log(
                "History clicked"
            );


        }
    );


}

// =====================================================
// DOWNLOAD REPORT
// =====================================================

if(downloadReportBtn){

    downloadReportBtn.addEventListener("click",()=>{

        downloadModal.classList.add("show");

    });

}