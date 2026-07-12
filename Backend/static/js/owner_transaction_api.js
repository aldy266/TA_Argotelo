document.addEventListener("DOMContentLoaded", async () => {
    "use strict";

    const el = {
        fullname: document.getElementById("fullname"),
        role: document.getElementById("role"),
        topbarTransactionSearch: document.getElementById("topbarTransactionSearch"),
        clearTopbarTransactionSearch: document.getElementById("clearTopbarTransactionSearch"),
        searchTransaction: document.getElementById("searchTransaction"),
        startDate: document.getElementById("startDate"),
        endDate: document.getElementById("endDate"),
        statusFilter: document.getElementById("statusFilter"),
        cashierFilter: document.getElementById("cashierFilter"),
        filterBtn: document.getElementById("filterBtn"),
        refreshBtn: document.getElementById("refreshBtn"),
        transactionTableBody: document.getElementById("transactionTableBody"),
        transactionCount: document.getElementById("transactionCount"),
        summaryTotalTransactions: document.getElementById("summaryTotalTransactions"),
        summaryRevenue: document.getElementById("summaryRevenue"),
        summaryAverage: document.getElementById("summaryAverage"),
        summaryTopPayment: document.getElementById("summaryTopPayment"),
        activeFilterBadge: document.getElementById("activeFilterBadge"),
        showingData: document.getElementById("showingData"),
        totalData: document.getElementById("totalData"),
        pagination: document.getElementById("pagination"),
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
        changePasswordBtn: document.getElementById("changePasswordBtn"),
        manageAccountsBtn: document.getElementById("manageAccountsBtn"),
        accountsModal: document.getElementById("accountsModal"),
        closeAccountsModal: document.getElementById("closeAccountsModal"),
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
        accountList:
            document.getElementById("accountList"),

        accountCount:
            document.getElementById("accountCount"),

        accountId:
            document.getElementById("accountId"),

        accountFullname:
            document.getElementById("accountFullname"),

        accountUsername:
            document.getElementById("accountUsername"),

        accountEmail:
            document.getElementById("accountEmail"),

        accountPhone:
            document.getElementById("accountPhone"),

        accountRole:
            document.getElementById("accountRole"),

        accountPassword:
            document.getElementById("accountPassword"),

        saveAccount:
            document.getElementById("saveAccount"),

        resetAccountForm:
            document.getElementById("resetAccountForm"),

    };

    let transactions = [];
    let loginUser = null;
    let notifications = [];
    let stockAlertIndex = 0;
    let stockAlertTimer = null;
    let accounts = [];

    let currentPage = 1;
    const rowsPerPage = 10;

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

    function formatPaymentMethod(value) {
        const labels = {
            CASH: "Cash",
            CASHLESS: "Cashless",
            QRIS: "QRIS",
            EWALLET: "E-Wallet",
            DEBIT: "Debit"
        };
        const key = String(value || "").toUpperCase();
        return labels[key] || value || "-";
    }

    function formatStatus(value) {
        const labels = {
            completed: "Selesai",
            cancelled: "Dibatalkan",
            cancel: "Dibatalkan",
            process: "Diproses"
        };
        const key = String(value || "").toLowerCase();
        return labels[key] || value || "-";
    }

    function customerInitials(value) {
        return String(value || "Umum")
            .trim()
            .split(/\s+/)
            .map(part => part.charAt(0))
            .join("")
            .slice(0, 2)
            .toUpperCase() || "U";
    }

    function stockQuantity(item) {
        const match = String(item?.stock ?? "").replace(",", ".").match(/-?\d+(\.\d+)?/);
        return match ? Number(match[0]) : null;
    }

    function stockAlertMessage(item) {
        const quantity = stockQuantity(item);
        const condition = quantity !== null && quantity <= 0 ? "habis" : "menipis";
        return `Stok ${item.product} ${condition}`;
    }

    function setStockAlertState(isDanger) {
        const alert = el.stockAlertText?.closest(".stock-alert");
        const icon = alert?.querySelector("i");

        alert?.classList.toggle("is-safe", !isDanger);
        alert?.classList.toggle("is-danger", isDanger);
        icon?.classList.toggle("bi-check-circle-fill", !isDanger);
        icon?.classList.toggle("bi-exclamation-triangle-fill", isDanger);
    }

    function syncSearchInputs(value) {
        if (el.searchTransaction && el.searchTransaction.value !== value) {
            el.searchTransaction.value = value;
        }

        if (el.topbarTransactionSearch && el.topbarTransactionSearch.value !== value) {
            el.topbarTransactionSearch.value = value;
        }

        el.clearTopbarTransactionSearch?.classList.toggle("show", Boolean(value.trim()));
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
            syncSearchInputs(params.get("search") || "");
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
            const cashier = params.get("cashier") || "";
            if (cashier) {
                el.cashierFilter.add(new Option(cashier, cashier));
            }
            el.cashierFilter.value = cashier;
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

    function renderUser() {
        if (!loginUser) return;
        el.fullname.textContent = loginUser.fullname || loginUser.username || "User";
        el.role.textContent = loginUser.role || "User";
    }

    async function loadTransactions() {
        const qs = queryString();
        const result = await api(`/api/transaction${qs ? `?${qs}` : ""}`);
        transactions = result.data || [];
        syncCashierOptions();
        renderTransactions();
    }

    function syncCashierOptions() {
        if (!el.cashierFilter) return;

        const selectedValue = el.cashierFilter.value;
        const cashierNames = [...new Set(
            transactions
                .map(item => item.cashier)
                .filter(name => name && name !== "-")
        )].sort((a, b) => a.localeCompare(b, "id-ID"));

        if (selectedValue && !cashierNames.includes(selectedValue)) {
            cashierNames.unshift(selectedValue);
        }

        el.cashierFilter.innerHTML = `
            <option value="">Semua Kasir</option>
            ${cashierNames.map(name => `
                <option value="${escapeHtml(name)}">
                    ${escapeHtml(name)}
                </option>
            `).join("")}
        `;

        if (selectedValue) {
            el.cashierFilter.value = selectedValue;
        }
    }

    function renderTransactionSummary() {
        const count = transactions.length;
        const revenue = transactions.reduce(
            (total, item) => total + Number(item.total || 0),
            0
        );
        const average = count ? revenue / count : 0;

        const paymentCounter = transactions.reduce((result, item) => {
            const method = item.payment_method || "-";
            result[method] = (result[method] || 0) + 1;
            return result;
        }, {});

        const topPayment = Object.entries(paymentCounter)
            .sort((a, b) => b[1] - a[1])[0];

        if (el.summaryTotalTransactions) {
            el.summaryTotalTransactions.textContent = count;
        }

        if (el.summaryRevenue) {
            el.summaryRevenue.textContent = rupiah(revenue);
        }

        if (el.summaryAverage) {
            el.summaryAverage.textContent = rupiah(average);
        }

        if (el.summaryTopPayment) {
            el.summaryTopPayment.textContent = topPayment
                ? `${formatPaymentMethod(topPayment[0])} (${topPayment[1]})`
                : "-";
        }
    }

    function renderActiveFilterBadge() {
        if (!el.activeFilterBadge) return;

        const filters = [];

        if (el.searchTransaction?.value.trim()) {
            filters.push("Pencarian aktif");
        }

        if (el.startDate?.value || el.endDate?.value) {
            filters.push("Periode dipilih");
        }

        if (el.statusFilter?.value) {
            filters.push(formatStatus(el.statusFilter.value));
        }

        if (el.cashierFilter?.value) {
            filters.push(`Kasir ${el.cashierFilter.value}`);
        }

        el.activeFilterBadge.textContent =
            filters.length ? filters.join(" / ") : "Semua data";
    }

    function renderNotifications() {


        if (el.notificationBadge) {

            el.notificationBadge.textContent = notifications.length;

        }


        if (el.notificationSubtitle) {

            el.notificationSubtitle.textContent =
                `${notifications.length} Notifikasi Aktif`;

        }


        if (el.stockAlertText) {
            const hasStockWarning = notifications.length > 0;

            setStockAlertState(hasStockWarning);

            if (stockAlertTimer) {
                clearInterval(stockAlertTimer);
                stockAlertTimer = null;
            }

            if (!hasStockWarning) {
                stockAlertIndex = 0;

                el.stockAlertText.textContent =
                    "Semua stok aman";


            } else {
                const rotateStockAlert = () => {
                    const item = notifications[stockAlertIndex % notifications.length];
                    el.stockAlertText.textContent = stockAlertMessage(item);
                    stockAlertIndex++;
                };

                rotateStockAlert();
                stockAlertTimer = setInterval(rotateStockAlert, 3000);


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

    async function loadAccounts(){

    try{

        const result = await api("/api/accounts");

        accounts = result.data || [];


        el.accountCount.textContent =
            `${accounts.length} akun`;


        el.accountList.innerHTML =
        accounts.map(acc=>`

            <div class="account-item" data-id="${acc.id}">

                <div class="account-info">

                    <h5>${acc.fullname}</h5>

                    <p>@${acc.username}</p>

                    <span class="account-badge">

                        ${acc.role} -
                        ${acc.is_active ? "Aktif" : "Nonaktif"}

                    </span>

                </div>


                <div class="account-actions">

                    <button 
                    class="edit-account"
                    type="button"
                    data-action="edit">

                    Edit

                    </button>


                    <button
                    class="toggle-account"
                    type="button"
                    data-action="toggle">

                    ${acc.is_active ? "Nonaktifkan" : "Aktifkan"}

                    </button>

                </div>

            </div>

        `).join("");


    }catch(error){

        el.accountList.innerHTML =
        "Gagal memuat akun";

    }

    }

    function renderTransactions() {

        el.transactionTableBody.innerHTML = "";

        el.transactionCount.textContent =
            `Total ${transactions.length} Transaksi`;

        renderTransactionSummary();
        renderActiveFilterBadge();

        const totalPages =
            Math.max(1, Math.ceil(transactions.length / rowsPerPage));

        currentPage =
            Math.min(Math.max(1, currentPage), totalPages);

        const start =
            (currentPage - 1) * rowsPerPage;


        const end =
            start + rowsPerPage;


        const pageData =
            transactions.slice(start,end);



        if(!transactions.length){

            el.transactionTableBody.innerHTML = `

            <tr>

                <td colspan="8">

                    <div class="empty-state">

                        <i class="bi bi-inbox"></i>

                        <strong>Tidak ada transaksi</strong>

                        <span>Ubah filter atau refresh untuk melihat data terbaru.</span>

                    </div>

                </td>

            </tr>`;

            renderPagination();

            return;

        }



        el.transactionTableBody.innerHTML =
        pageData.map(item => `

            <tr>

                <td>
                    <span class="transaction-id">
                        ${escapeHtml(item.transaction_number)}
                    </span>
                </td>

                <td>
                    <span class="date-cell">
                        <i class="bi bi-calendar2-week"></i>
                        ${escapeHtml(item.date)}
                    </span>
                </td>

                <td>
                    <div class="customer-mini">
                        <span>${escapeHtml(customerInitials(item.customer_name))}</span>
                        <strong>${escapeHtml(item.customer_name || "Umum")}</strong>
                    </div>
                </td>

                <td>
                    <span class="cashier-chip">
                        ${escapeHtml(item.cashier)}
                    </span>
                </td>

                <td>
                    <strong class="amount-cell">${rupiah(item.total)}</strong>
                </td>

                <td>
                    <span class="badge ${
                        item.status === "completed"
                        ? "completed"
                        : "cancel"
                    }">

                    ${escapeHtml(formatStatus(item.status))}

                    </span>
                </td>


                <td>
                    <span class="payment-pill">
                        ${escapeHtml(formatPaymentMethod(item.payment_method))}
                    </span>
                </td>


                <td>

                    <button 
                    class="detail-btn"
                    data-id="${item.id}"
                    type="button"
                    title="Lihat detail"
                    aria-label="Lihat detail transaksi ${escapeHtml(item.transaction_number)}">

                        <i class="bi bi-eye-fill"></i>

                    </button>

                </td>


            </tr>


        `).join("");


        renderPagination();

    }

    function renderPagination(){

        const totalPages =
            Math.max(1, Math.ceil(transactions.length / rowsPerPage));

        currentPage =
            Math.min(Math.max(1, currentPage), totalPages);


        const start =
            transactions.length
            ? ((currentPage - 1) * rowsPerPage) + 1
            : 0;


        const end =
            Math.min(
                currentPage * rowsPerPage,
                transactions.length
            );


        el.showingData.textContent =
            `${start} - ${end}`;


        el.totalData.textContent =
            transactions.length;



        if(!el.pagination) return;


        let html = `

        <button
        class="page-nav"
        type="button"
        ${currentPage === 1 ? "disabled":""}
        data-page="${currentPage - 1}">

        <i class="bi bi-chevron-left"></i>

        </button>

        `;

        if(!transactions.length){
            html += `
            <button
            class="active"
            type="button"
            disabled
            data-page="1">1</button>`;
        }else{
            let lastRenderedPage = 0;
            for(let i=1;i<=totalPages;i++){
                const isVisible =
                    i === 1 ||
                    i === totalPages ||
                    Math.abs(i - currentPage) <= 1;

                if(!isVisible) continue;

                if(lastRenderedPage && i - lastRenderedPage > 1){
                    html += `<span class="page-dots">...</span>`;
                }

                html += `
                <button
                class="${i===currentPage?'active':''}"
                type="button"
                data-page="${i}">${i}</button>`;

                lastRenderedPage = i;
            }
        }


        html += `

        <button
        class="page-nav"
        type="button"
        ${currentPage === totalPages ? "disabled":""}
        data-page="${currentPage + 1}">

        <i class="bi bi-chevron-right"></i>

        </button>`;


        el.pagination.innerHTML = html;


    }

    async function showTransactionDetail(transactionId) {

        const result =
            await api(`/api/transaction/${transactionId}`);

        const trx = result.data;

        el.transactionDetail.innerHTML = `


            <div class="detail-row">
                <span>ID Transaksi</span>
                <b>${escapeHtml(trx.transaction_number)}</b>
            </div>

            <div class="detail-row">
                <span>Tanggal</span>
                <b>${escapeHtml(trx.date)} ${escapeHtml(trx.time)}</b>
            </div>

            <div class="detail-row">
                <span>Pelanggan</span>
                <b>${escapeHtml(trx.customer_name || "Umum")}</b>
            </div>

            <div class="detail-row">
                <span>Kasir</span>
                <b>${escapeHtml(trx.cashier)}</b>
            </div>

            <div class="detail-title">
                Item Pesanan
            </div>

            <div class="detail-product">

                ${
                    trx.items.map(item => `

                        <div>
                            ${item.quantity}x 
                            ${escapeHtml(item.name)}
                        </div>

                    `).join("")
                }

            </div>

            <div class="detail-row">
                <span>Subtotal</span>
                <b>${rupiah(trx.subtotal)}</b>
            </div>

            <div class="detail-row">
                <span>Pajak</span>
                <b>${rupiah(trx.tax)}</b>
            </div>

            <div class="detail-row total">
                <span>Total</span>
                <b>${rupiah(trx.total)}</b>
            </div>

            <div class="detail-row">
                <span>Pembayaran</span>
                <b>${escapeHtml(formatPaymentMethod(trx.payment_method))}</b>
            </div>

            <div class="detail-row">
                <span>Status</span>

                <span class="badge completed">
                    ${escapeHtml(trx.status.toUpperCase())}
                </span>

            </div>

            <div class="detail-row">

                <span>Receipt</span>

                <a 
                href="/receipt/${trx.id}"
                target="_blank">

                    Buka Struk

                </a>

            </div>


        `;

        el.transactionModal.classList.add("show");

    }

    function closeTransactionModal() {
        el.transactionModal.classList.remove("show");
    }

    function closeProfileModal() {
        el.editProfileModal?.classList.remove("show");
    }

    function openProfileModal() {
        if (!loginUser) return;
        if (el.editFullname) el.editFullname.value = loginUser.fullname || "";
        if (el.editUsername) el.editUsername.value = loginUser.username || "";
        if (el.editEmail) el.editEmail.value = loginUser.email || "";
        if (el.editPhone) el.editPhone.value = loginUser.phone || "";
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
        el.searchTransaction.addEventListener("input", event => {
            syncSearchInputs(event.target.value);
            currentPage = 1;
            loadTransactions().catch(error => alert(error.message));
        });
        el.topbarTransactionSearch?.addEventListener("input", event => {
            syncSearchInputs(event.target.value);
            currentPage = 1;
            loadTransactions().catch(error => alert(error.message));
        });
        el.clearTopbarTransactionSearch?.addEventListener("click", () => {
            syncSearchInputs("");
            currentPage = 1;
            loadTransactions().catch(error => alert(error.message));
            el.topbarTransactionSearch?.focus();
        });
        el.filterBtn.addEventListener("click", () => {
            currentPage = 1;
            loadTransactions().catch(error => alert(error.message));
        });
        el.refreshBtn?.addEventListener("click", () => loadTransactions().catch(error => alert(error.message)));

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

            event.preventDefault();
            event.stopPropagation();


            el.notificationMenu
            ?.classList.remove("active");


            el.settingsMenu
            ?.classList.toggle("active");


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

       el.viewAllNotification?.addEventListener("click", event => {

            event.preventDefault();


            console.log("LIHAT SEMUA KLIK");


            renderAllNotifications();


            el.notificationMenu
            ?.classList.remove("active");


            el.notificationModal
            ?.classList.add("show");

        });

            el.closeNotificationModal
        ?.addEventListener("click",()=>{

            el.notificationModal
            ?.classList.remove("show");

        });


        el.closeNotificationButton
        ?.addEventListener("click",()=>{

            el.notificationModal
            ?.classList.remove("show");

        });

        el.closeProfileModal?.addEventListener("click", closeProfileModal);
        el.cancelProfile?.addEventListener("click", closeProfileModal);
        el.saveProfile?.addEventListener("click", () => {
            saveProfile().catch(error => alert(error.message));
        });
        el.changePasswordBtn?.addEventListener("click", event => {
            event.preventDefault();
            openPasswordModal();
        });

      el.manageAccountsBtn?.addEventListener("click", event => {

            event.preventDefault();

            el.settingsMenu?.classList.remove("active");

           el.accountsModal.classList.add("show");
            loadAccounts();

        });

        el.closeAccountsModal?.addEventListener("click",()=>{

            el.accountsModal
            ?.classList.remove("show");

        });
        
        el.closePasswordModal?.addEventListener("click", closePasswordModal);
        el.cancelPassword?.addEventListener("click", closePasswordModal);
        el.savePassword?.addEventListener("click", () => {
            savePassword().catch(error => alert(error.message));
        });

        document.querySelectorAll(".logout, .logout-setting").forEach(button => {
            button.addEventListener("click", async event => {
                event.preventDefault();
                const response = await fetch("/api/logout", { method: "POST", credentials: "include" });
                const result = await response.json().catch(() => ({}));
                window.location.href = result.redirect_url || "/";
            });
        });

        window.addEventListener("click", event => {
            if (event.target === el.transactionModal) closeTransactionModal();
            if (event.target === el.downloadModal) el.downloadModal.classList.remove("show");
            if (event.target === el.editProfileModal) closeProfileModal();
            if (event.target === el.passwordModal) closePasswordModal();
        });

        el.saveAccount?.addEventListener("click", async () => {

            const id = el.accountId.value;

            const payload = {

                fullname: el.accountFullname.value,
                username: el.accountUsername.value,
                email: el.accountEmail.value,
                phone: el.accountPhone.value,
                role: el.accountRole.value,
                password: el.accountPassword.value

            };


            try{

                if(id){

                    await api(
                        `/api/accounts/${id}`,
                        {
                            method:"PUT",
                            body:JSON.stringify(payload)
                        }
                    );

                }else{

                    await api(
                        "/api/accounts",
                        {
                            method:"POST",
                            body:JSON.stringify(payload)
                        }
                    );

                }


                resetAccountForm();

                loadAccounts();


            }catch(error){

                alert("Gagal menyimpan akun");

            }

        });



        // FORM BARU
        el.resetAccountForm?.addEventListener("click",()=>{

            resetAccountForm();

        });

        el.accountList?.addEventListener("click",event=>{


            const button =
                event.target.closest("[data-action]");


            if(!button) return;


            const row =
                button.closest(".account-item");


            const acc =
                accounts.find(
                    item => String(item.id) === row.dataset.id
                );


            if(!acc) return;



            if(button.dataset.action==="edit"){

                fillAccountForm(acc);

            }



            if(button.dataset.action==="toggle"){

                toggleManagedAccount(acc);

            }


        });

        el.pagination?.addEventListener("click", e=>{

            const btn =
                e.target.closest("button");


            if(!btn || btn.disabled) return;


            currentPage =
                Number(btn.dataset.page) || 1;


            renderTransactions();


        });

    }

    function resetAccountForm(){

    el.accountId.value = "";

    el.accountFullname.value = "";

    el.accountUsername.value = "";

    el.accountEmail.value = "";

    el.accountPhone.value = "";

    el.accountPassword.value = "";

    el.accountRole.value = "FINANCE";

    }

    function fillAccountForm(acc){

    el.accountId.value = acc.id;

    el.accountFullname.value = acc.fullname;

    el.accountUsername.value = acc.username;

    el.accountEmail.value = acc.email || "";

    el.accountPhone.value = acc.phone || "";

    el.accountRole.value = acc.role;

}



    async function toggleManagedAccount(acc){


        await api(
            `/api/accounts/${acc.id}/toggle`,
            {
                method:"PATCH"
            }
        );


        await loadAccounts();

    }

    await loadUser();

    hydrateFiltersFromUrl();

    await loadTransactions();

    await loadNotifications();

    bindEvents();

    setInterval(loadNotifications, 30000);
});
