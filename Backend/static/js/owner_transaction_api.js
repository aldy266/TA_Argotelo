document.addEventListener("DOMContentLoaded", async () => {
    "use strict";

    const el = {
        fullname: document.getElementById("fullname"),
        role: document.getElementById("role"),
        profileImage: document.getElementById("profileImage"),
        searchTransaction: document.getElementById("searchTransaction"),
        startDate: document.getElementById("startDate"),
        endDate: document.getElementById("endDate"),
        statusFilter: document.getElementById("statusFilter"),
        cashierFilter: document.getElementById("cashierFilter"),
        filterBtn: document.getElementById("filterBtn"),
        refreshBtn: document.getElementById("refreshBtn"),
        transactionTableBody: document.getElementById("transactionTableBody"),
        transactionCount: document.getElementById("transactionCount"),
        showingData: document.getElementById("showingData"),
        totalData: document.getElementById("totalData"),
        transactionModal: document.getElementById("transactionModal"),
        transactionDetail: document.getElementById("transactionDetail"),
        closeTransactionModal: document.getElementById("closeTransactionModal"),
        closeTransaction: document.getElementById("closeTransaction"),
        downloadReportBtn: document.getElementById("downloadReportBtn"),
        downloadModal: document.getElementById("downloadModal"),
        closeDownloadModal: document.getElementById("closeDownloadModal"),
        downloadPdf: document.getElementById("downloadPdf"),
        downloadExcel: document.getElementById("downloadExcel"),
        settingBtn: document.getElementById("settingBtn"),
        settingsMenu: document.getElementById("settingsMenu"),
        notificationBtn: document.getElementById("notificationBtn"),
        notificationMenu: document.getElementById("notificationMenu"),
        notificationBadge: document.getElementById("notificationBadge"),
        notificationSubtitle: document.getElementById("notificationSubtitle"),
        notificationList: document.getElementById("notificationList"),
        notificationFooter: document.getElementById("notificationFooter"),
        stockAlertText: document.getElementById("stockAlertText"),
        editProfileBtn: document.getElementById("editProfileBtn"),
        editProfileModal: document.getElementById("editProfileModal"),
        closeProfileModal: document.getElementById("closeProfileModal"),
        cancelProfile: document.getElementById("cancelProfile"),
        saveProfile: document.getElementById("saveProfile"),
        editFullname: document.getElementById("editFullname"),
        editUsername: document.getElementById("editUsername"),
        editEmail: document.getElementById("editEmail"),
        editPhone: document.getElementById("editPhone"),
        photoInput: document.getElementById("photoInput"),
        previewPhoto: document.getElementById("previewPhoto"),
        changePasswordBtn: document.getElementById("changePasswordBtn"),
        passwordModal: document.getElementById("passwordModal"),
        closePasswordModal: document.getElementById("closePasswordModal"),
        cancelPassword: document.getElementById("cancelPassword"),
        savePassword: document.getElementById("savePassword"),
        oldPassword: document.getElementById("oldPassword"),
        newPassword: document.getElementById("newPassword"),
        confirmPassword: document.getElementById("confirmPassword"),

        notificationBtn:
            document.getElementById("notificationBtn"),

        notificationMenu:
            document.getElementById("notificationMenu"),

        notificationBadge:
            document.getElementById("notificationBadge"),

        notificationSubtitle:
            document.getElementById("notificationSubtitle"),

        notificationList:
            document.getElementById("notificationList"),

        stockAlertText:
            document.getElementById("stockAlertText"),


        // LIHAT SEMUA
        viewAllNotification:
            document.getElementById("viewAllNotification"),

        notificationModal:
            document.getElementById("notificationModal"),

        allNotificationList:
            document.getElementById("allNotificationList"),

        allNotificationCount:
            document.getElementById("allNotificationCount"),

        closeNotificationModal:
            document.getElementById("closeNotificationModal"),

        closeNotificationButton:
            document.getElementById("closeNotificationButton"),

    };

    let transactions = [];
    let loginUser = null;
    let notifications = [];
    let stockAlertIndex = 0;
    let stockAlertTimer = null;

    function rupiah(value) {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 0
        }).format(Number(value || 0));
    }

    function escapeHtml(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll("\"", "&quot;")
            .replaceAll("'", "&#039;");
    }

    async function api(url, options = {}) {
        const response = await fetch(url, {
            credentials: "include",
            ...options,
            headers: {
                ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
                ...options.headers
            }
        });
        const data = await response.json();
        if (!response.ok || data.success === false) {
            throw new Error(data.message || "Request gagal");
        }
        return data;
    }

    function queryString() {
        const params = new URLSearchParams();
        if (el.searchTransaction.value) params.set("search", el.searchTransaction.value);
        if (el.startDate.value) params.set("start", el.startDate.value);
        if (el.endDate.value) params.set("end", el.endDate.value);
        if (el.statusFilter.value) params.set("status", el.statusFilter.value);
        if (el.cashierFilter.value) params.set("cashier", el.cashierFilter.value);
        return params.toString();
    }

    function hydrateFiltersFromUrl() {
        const params = new URLSearchParams(window.location.search);
        if (params.has("search") && el.searchTransaction) {
            el.searchTransaction.value = params.get("search") || "";
        }
        if (params.has("start") && el.startDate) {
            el.startDate.value = params.get("start") || "";
        }
        if (params.has("end") && el.endDate) {
            el.endDate.value = params.get("end") || "";
        }
        if (params.has("status") && el.statusFilter) {
            el.statusFilter.value = params.get("status") || "";
        }
        if (params.has("cashier") && el.cashierFilter) {
            el.cashierFilter.value = params.get("cashier") || "";
        }
    }

    async function loadUser() {
        try {
            const result = await api("/api/me");
            loginUser = result.user;
            renderUser();
        } catch (error) {
            window.location.href = "/";
        }
    }

    function profilePhoto() {
        return loginUser?.photo || "/static/images/profile.png";
    }

    function renderUser() {
        if (!loginUser) return;
        el.fullname.textContent = loginUser.fullname || loginUser.username || "User";
        el.role.textContent = loginUser.role || "User";
        if (el.profileImage) el.profileImage.src = profilePhoto();
        if (el.previewPhoto) el.previewPhoto.src = profilePhoto();
    }

    async function loadTransactions() {
        const qs = queryString();
        const result = await api(`/api/transaction${qs ? `?${qs}` : ""}`);
        transactions = result.data || [];
        renderTransactions();
    }

    function renderNotifications() {


        if (el.notificationBadge) {

            el.notificationBadge.textContent = notifications.length;

        }


        if (el.notificationSubtitle) {

            el.notificationSubtitle.textContent =
                `${notifications.length} Notifikasi Aktif`;

        }


        // =========================
        // ALERT MERAH MUTER
        // =========================

        if (el.stockAlertText) {


            if (!notifications.length) {


                el.stockAlertText.textContent =
                    "Semua stok aman";


            } else {


                let index = 0;


                el.stockAlertText.textContent =
                    `Stok ${notifications[index].product} menipis`;



                setInterval(() => {


                    index++;


                    if (index >= notifications.length) {

                        index = 0;

                    }


                    el.stockAlertText.textContent =
                        `Stok ${notifications[index].product} menipis`;


                }, 3000);


            }

        }


        // =========================
        // DROPDOWN BELL
        // =========================

        if (!el.notificationList) return;


        if (!notifications.length) {


            el.notificationList.innerHTML = `

                <div class="notification-empty">

                    <i class="bi bi-check-circle-fill"></i>

                    <span>Tidak ada notifikasi.</span>

                </div>

            `;


            if (el.notificationFooter) {

                el.notificationFooter.style.display = "none";

            }


            return;

        }



        el.notificationList.innerHTML =
            notifications.slice(0,3).map(item => `

            <div class="notification-item">


                <div class="notification-icon">

                    <i class="bi bi-exclamation-triangle-fill"></i>

                </div>


                <div class="notification-info">

                    <h5>

                        Stok ${escapeHtml(item.product)} Menipis

                    </h5>


                    <span>

                        Sisa: ${escapeHtml(item.stock)}

                    </span>


                    <small>

                        ${escapeHtml(item.time || "")}

                    </small>


                </div>


            </div>

        `).join("");



        if (el.notificationFooter) {

            el.notificationFooter.style.display =
                notifications.length > 3 ? "block" : "none";

        }


    }

    async function loadNotifications() {
        try {
            const result = await api("/api/notification");
            notifications = result.data || [];
        } catch (error) {
            notifications = [];
        }
        renderNotifications();
    }

    function renderTransactions() {
        el.transactionTableBody.innerHTML = "";
        el.transactionCount.textContent = `Total ${transactions.length} Transaksi`;
        el.totalData.textContent = transactions.length;
        el.showingData.textContent = transactions.length ? `1 - ${transactions.length}` : "0";

        if (!transactions.length) {
            el.transactionTableBody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align:center;padding:40px;">
                        Tidak ada transaksi.
                    </td>
                </tr>
            `;
            return;
        }

        el.transactionTableBody.innerHTML = transactions.map(item => `
            <tr>
                <td>${escapeHtml(item.transaction_number)}</td>
                <td>${escapeHtml(item.date)}</td>
                <td>${escapeHtml(item.customer_name || "Umum")}</td>
                <td>${escapeHtml(item.cashier)}</td>
                <td><strong>${rupiah(item.total)}</strong></td>
                <td><span class="badge ${item.status === "completed" ? "completed" : "cancel"}">${escapeHtml(item.status.toUpperCase())}</span></td>
                <td>${escapeHtml(item.payment_method)}</td>
                <td>
                    <button class="detail-btn" data-id="${item.id}" type="button">
                        <i class="bi bi-eye-fill"></i>
                    </button>
                </td>
            </tr>
        `).join("");
    }

    async function showTransactionDetail(transactionId) {
        const result = await api(`/api/transaction/${transactionId}`);
        const trx = result.data;

        el.transactionDetail.innerHTML = `
            <div class="detail-group"><h4>ID Transaksi</h4><span>${escapeHtml(trx.transaction_number)}</span></div>
            <div class="detail-group"><h4>Tanggal</h4><span>${escapeHtml(trx.date)} ${escapeHtml(trx.time)}</span></div>
            <div class="detail-group"><h4>Pelanggan</h4><span>${escapeHtml(trx.customer_name || "Umum")}</span></div>
            <div class="detail-group"><h4>Kasir</h4><span>${escapeHtml(trx.cashier)}</span></div>
            <div class="detail-group"><h4>Item</h4><span>${trx.items.map(item => `${item.quantity}x ${escapeHtml(item.name)}`).join("<br>") || "-"}</span></div>
            <div class="detail-group"><h4>Subtotal</h4><span>${rupiah(trx.subtotal)}</span></div>
            <div class="detail-group"><h4>Pajak</h4><span>${rupiah(trx.tax)}</span></div>
            <div class="detail-group"><h4>Total</h4><span>${rupiah(trx.total)}</span></div>
            <div class="detail-group"><h4>Pembayaran</h4><span>${escapeHtml(trx.payment_method)}</span></div>
            <div class="detail-group"><h4>Status</h4><span class="badge completed">${escapeHtml(trx.status.toUpperCase())}</span></div>
            <div class="detail-group"><h4>Receipt</h4><a href="/receipt/${trx.id}" target="_blank">Buka struk</a></div>
        `;

        el.transactionModal.classList.add("show");
    }

    function closeTransactionModal() {
        el.transactionModal.classList.remove("show");
    }

    function closeProfileModal() {
        el.editProfileModal?.classList.remove("show");
        if (el.photoInput) el.photoInput.value = "";
        if (el.previewPhoto) el.previewPhoto.src = profilePhoto();
    }

    function openProfileModal() {
        if (!loginUser) return;
        if (el.editFullname) el.editFullname.value = loginUser.fullname || "";
        if (el.editUsername) el.editUsername.value = loginUser.username || "";
        if (el.editEmail) el.editEmail.value = loginUser.email || "";
        if (el.editPhone) el.editPhone.value = loginUser.phone || "";
        if (el.previewPhoto) el.previewPhoto.src = profilePhoto();
        el.settingsMenu?.classList.remove("active");
        el.editProfileModal?.classList.add("show");
    }

    async function saveProfile() {
        const fullname = el.editFullname?.value.trim() || "";
        const username = el.editUsername?.value.trim() || "";

        if (!fullname || !username) {
            alert("Nama lengkap dan username wajib diisi");
            return;
        }

        const formData = new FormData();
        formData.append("fullname", fullname);
        formData.append("username", username);
        formData.append("email", el.editEmail?.value.trim() || "");
        formData.append("phone", el.editPhone?.value.trim() || "");

        if (el.photoInput?.files?.[0]) {
            formData.append("photo", el.photoInput.files[0]);
        }

        const result = await api("/api/update-profile", {
            method: "POST",
            body: formData
        });

        loginUser = {
            ...loginUser,
            ...result.user,
            role: loginUser?.role
        };
        renderUser();
        closeProfileModal();
        alert(result.message || "Profil berhasil diperbarui");
    }

    function closePasswordModal() {
        el.passwordModal?.classList.remove("show");
        if (el.oldPassword) el.oldPassword.value = "";
        if (el.newPassword) el.newPassword.value = "";
        if (el.confirmPassword) el.confirmPassword.value = "";
    }

    function openPasswordModal() {
        el.settingsMenu?.classList.remove("active");
        el.passwordModal?.classList.add("show");
    }

    async function savePassword() {
        const oldPassword = el.oldPassword?.value || "";
        const newPassword = el.newPassword?.value || "";
        const confirmPassword = el.confirmPassword?.value || "";

        if (!oldPassword || !newPassword) {
            alert("Password lama dan password baru wajib diisi");
            return;
        }
        if (newPassword !== confirmPassword) {
            alert("Konfirmasi password tidak sama");
            return;
        }

        const result = await api("/api/change-password", {
            method: "POST",
            body: JSON.stringify({
                old_password: oldPassword,
                new_password: newPassword
            })
        });

        closePasswordModal();
        alert(result.message || "Password berhasil diperbarui");
    }

    function renderAllNotifications(){

        if(!el.allNotificationList) return;


        el.allNotificationCount.textContent =
            `${notifications.length} Notifikasi`;


        if(!notifications.length){

            el.allNotificationList.innerHTML =
                "<p>Tidak ada stok menipis.</p>";

            return;
        }


        el.allNotificationList.innerHTML =
            notifications.map(item => `

            <div class="notification-item">

                <div class="notification-icon">

                    <i class="bi bi-exclamation-triangle-fill"></i>

                </div>


                <div class="notification-info">

                    <h5>
                        Stok ${escapeHtml(item.product)} Menipis
                    </h5>

                    <span>
                        Sisa : ${escapeHtml(item.stock)}
                    </span>

                    <small>
                        ${escapeHtml(item.time || "Real-time")}
                    </small>

                </div>

            </div>

        `).join("");

    }

    function bindEvents() {
        el.searchTransaction.addEventListener("input", () => loadTransactions().catch(error => alert(error.message)));
        el.filterBtn.addEventListener("click", () => loadTransactions().catch(error => alert(error.message)));
        el.refreshBtn.addEventListener("click", () => loadTransactions().catch(error => alert(error.message)));

        el.transactionTableBody.addEventListener("click", event => {
            const button = event.target.closest(".detail-btn");
            if (!button) return;
            showTransactionDetail(button.dataset.id).catch(error => alert(error.message));
        });

        el.closeTransactionModal?.addEventListener("click", closeTransactionModal);
        el.closeTransaction?.addEventListener("click", closeTransactionModal);

        el.downloadReportBtn?.addEventListener("click", () => el.downloadModal.classList.add("show"));
        el.closeDownloadModal?.addEventListener("click", () => el.downloadModal.classList.remove("show"));
        if (el.downloadPdf) {
            el.downloadPdf.disabled = true;
            el.downloadPdf.title = "Export PDF belum tersedia";
        }
        el.downloadExcel?.addEventListener("click", () => {
            const qs = queryString();
            window.location.href = `/api/transaction/export-excel${qs ? `?${qs}` : ""}`;
        });

        el.settingBtn?.addEventListener("click", event => {
            event.stopPropagation();
            el.notificationMenu?.classList.remove("active");
            el.settingsMenu?.classList.toggle("active");
        });
        el.notificationBtn?.addEventListener("click", event => {
            event.stopPropagation();
            el.settingsMenu?.classList.remove("active");
            el.notificationMenu?.classList.toggle("active");
        });
        document.addEventListener("click", () => {
            el.settingsMenu?.classList.remove("active");
            el.notificationMenu?.classList.remove("active");
        });
        el.settingsMenu?.addEventListener("click", event => event.stopPropagation());
        el.notificationMenu?.addEventListener("click", event => event.stopPropagation());

        el.editProfileBtn?.addEventListener("click", event => {
            event.preventDefault();
            openProfileModal();
        });

       document.addEventListener("click", function(event){

            const btn = event.target.closest("#viewAllNotification");

            if(!btn) return;


            event.preventDefault();

            event.stopPropagation();


            console.log("LIHAT SEMUA KLIK");


            renderAllNotifications();


            document
            .getElementById("notificationMenu")
            ?.classList.remove("active");


            document
            .getElementById("notificationModal")
            ?.classList.add("show");


        });

       document
        .getElementById("closeNotificationModal")
        ?.addEventListener("click",()=>{

            document
            .getElementById("notificationModal")
            ?.classList.remove("show");

        });


        document
        .getElementById("closeNotificationButton")
        ?.addEventListener("click",()=>{

            document
            .getElementById("notificationModal")
            ?.classList.remove("show");

        });

        el.closeProfileModal?.addEventListener("click", closeProfileModal);
        el.cancelProfile?.addEventListener("click", closeProfileModal);
        el.saveProfile?.addEventListener("click", () => {
            saveProfile().catch(error => alert(error.message));
        });
        el.photoInput?.addEventListener("change", () => {
            const file = el.photoInput.files?.[0];
            if (file && el.previewPhoto) {
                el.previewPhoto.src = URL.createObjectURL(file);
            }
        });
        el.changePasswordBtn?.addEventListener("click", event => {
            event.preventDefault();
            openPasswordModal();
        });
        el.closePasswordModal?.addEventListener("click", closePasswordModal);
        el.cancelPassword?.addEventListener("click", closePasswordModal);
        el.savePassword?.addEventListener("click", () => {
            savePassword().catch(error => alert(error.message));
        });

        document.querySelectorAll(".logout, .logout-setting").forEach(button => {
            button.addEventListener("click", async event => {
                event.preventDefault();
                await fetch("/api/logout", { method: "POST", credentials: "include" });
                window.location.href = "/";
            });
        });

        window.addEventListener("click", event => {
            if (event.target === el.transactionModal) closeTransactionModal();
            if (event.target === el.downloadModal) el.downloadModal.classList.remove("show");
            if (event.target === el.editProfileModal) closeProfileModal();
            if (event.target === el.passwordModal) closePasswordModal();
        });
    }

    await loadUser();

    hydrateFiltersFromUrl();

    await loadTransactions();

    await loadNotifications();

    bindEvents();

    setInterval(loadNotifications, 30000);
});
