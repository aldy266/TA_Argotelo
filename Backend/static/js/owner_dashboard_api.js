document.addEventListener("DOMContentLoaded", async () => {
    "use strict";

    const state = {
        user: null,
        filter: "today",
        notifications: [],
        dashboardData: null,
        search: "",
        accounts: [],
        stockAlertIndex: 0,
        stockAlertTimer: null
    };

    const el = {
        fullname: document.getElementById("fullname"),
        role: document.getElementById("role"),
        todayBtn: document.getElementById("todayBtn"),
        weekBtn: document.getElementById("weekBtn"),
        monthBtn: document.getElementById("monthBtn"),
        startDate: document.getElementById("startDate"),
        endDate: document.getElementById("endDate"),
        filterBtn: document.getElementById("filterBtn"),
        dashboardSearch: document.getElementById("dashboardSearch"),
        clearSearch: document.getElementById("clearSearch"),
        dashboardPeriod: document.getElementById("dashboard-period"),
        salesValue: document.getElementById("salesValue"),
        salesInfo: document.getElementById("salesInfo"),
        transactionValue: document.getElementById("transactionValue"),
        transactionInfo: document.getElementById("transactionInfo"),
        incomeValue: document.getElementById("incomeValue"),
        incomeInfo: document.getElementById("incomeInfo"),
        attendanceValue: document.getElementById("attendanceValue"),
        attendanceInfo: document.getElementById("attendanceInfo"),
        topProductList: document.getElementById("topProductList"),
        salesChartSubtitle: document.getElementById("salesChartSubtitle"),
        transactionTableBody: document.getElementById("transactionTableBody"),
        transactionUpdateTime: document.getElementById("transactionUpdateTime"),
        notificationBadge: document.getElementById("notificationBadge"),
        notificationSubtitle: document.getElementById("notificationSubtitle"),
        notificationList: document.getElementById("notificationList"),
        notificationFooter: document.getElementById("notificationFooter"),
        notificationMenu: document.getElementById("notificationMenu"),
        notificationBtn: document.getElementById("notificationBtn"),
        notificationModal: document.getElementById("notificationModal"),
        allNotificationList: document.getElementById("allNotificationList"),
        allNotificationCount: document.getElementById("allNotificationCount"),
        closeNotificationModal: document.getElementById("closeNotificationModal"),
        closeNotificationButton: document.getElementById("closeNotificationButton"),
        stockAlertText: document.getElementById("stockAlertText"),
        settingBtn: document.getElementById("settingBtn"),
        settingsMenu: document.getElementById("settingsMenu"),
        editProfileBtn: document.getElementById("editProfileBtn"),
        editProfileModal: document.getElementById("editProfileModal"),
        closeProfileModal: document.getElementById("closeProfileModal"),
        cancelProfile: document.getElementById("cancelProfile"),
        saveProfile: document.getElementById("saveProfile"),
        editFullname: document.getElementById("editFullname"),
        editUsername: document.getElementById("editUsername"),
        editEmail: document.getElementById("editEmail"),
        editPhone: document.getElementById("editPhone"),
        passwordModal: document.getElementById("passwordModal"),
        changePasswordBtn: document.getElementById("changePasswordBtn"),
        closePasswordModal: document.getElementById("closePasswordModal"),
        cancelPassword: document.getElementById("cancelPassword"),
        savePassword: document.getElementById("savePassword"),
        oldPassword: document.getElementById("oldPassword"),
        newPassword: document.getElementById("newPassword"),
        confirmPassword: document.getElementById("confirmPassword"),
        downloadReportBtn: document.getElementById("downloadReportBtn"),
        manageAccountsBtn: document.getElementById("manageAccountsBtn"),
        accountsModal: document.getElementById("accountsModal"),
        closeAccountsModal: document.getElementById("closeAccountsModal"),
        accountId: document.getElementById("accountId"),
        accountFullname: document.getElementById("accountFullname"),
        accountUsername: document.getElementById("accountUsername"),
        accountEmail: document.getElementById("accountEmail"),
        accountPhone: document.getElementById("accountPhone"),
        accountRole: document.getElementById("accountRole"),
        accountPassword: document.getElementById("accountPassword"),
        resetAccountForm: document.getElementById("resetAccountForm"),
        saveAccount: document.getElementById("saveAccount"),
        accountList: document.getElementById("accountList"),
        accountCount: document.getElementById("accountCount")
    };

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

    function formatDate(value) {
        if (!value) return "";
        const date = new Date(`${value}T00:00:00`);
        return date.toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "long",
            year: "numeric"
        });
    }

    function periodLabel(stats = state.dashboardData?.statistics) {
        const start = stats?.period_start || "";
        const end = stats?.period_end || "";

        if (state.filter === "today") return "Hari ini";
        if (state.filter === "week") return "Minggu ini";
        if (state.filter === "month") return "Bulan ini";
        if (start && end && start === end) return formatDate(start);
        if (start && end) return `${formatDate(start)} - ${formatDate(end)}`;
        return "Periode dipilih";
    }

    function updatePeriodText(stats) {
        const label = periodLabel(stats);

        if (el.dashboardPeriod) {
            el.dashboardPeriod.textContent =
                `Menampilkan performa kedai untuk ${label.toLowerCase()}.`;
        }

        if (el.salesChartSubtitle) {
            el.salesChartSubtitle.textContent =
                "Tren penjualan terbaru dengan skala visual yang lebih mudah dibaca.";
        }
    }

    function compactRupiah(value) {
        const number = Number(value || 0);
        if (number >= 1000000) {
            return `Rp ${(number / 1000000).toLocaleString("id-ID", { maximumFractionDigits: 1 })} jt`;
        }
        if (number >= 1000) {
            return `Rp ${Math.round(number / 1000).toLocaleString("id-ID")} rb`;
        }
        return rupiah(number);
    }

    function setActiveFilter(button) {
        [el.todayBtn, el.weekBtn, el.monthBtn].forEach(btn => btn?.classList.remove("active"));
        button?.classList.add("active");
    }

    function selectedPeriodParams() {
        const stats = state.dashboardData?.statistics;
        const params = new URLSearchParams();
        if (stats?.period_start) params.set("start", stats.period_start);
        if (stats?.period_end) params.set("end", stats.period_end);
        return params;
    }

    function validateCustomDate() {
        const start = el.startDate?.value || "";
        const end = el.endDate?.value || "";
        if (!start || !end) {
            throw new Error("Tanggal awal dan akhir wajib diisi");
        }
        if (start > end) {
            throw new Error("Tanggal awal tidak boleh melewati tanggal akhir");
        }
        return { start, end };
    }

    function renderUser() {
        if (!state.user) return;
        if (el.fullname) {
            el.fullname.textContent = state.user.fullname || state.user.username || "User";
        }
        if (el.role) {
            el.role.textContent = state.user.role || "User";
        }
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

    async function loadUser() {
        try {
            const result = await api("/api/me");
            state.user = result.user;
            renderUser();
        } catch (error) {
            window.location.href = "/";
        }
    }

    function updateStatistics(stats) {
        const label = periodLabel(stats);

        updatePeriodText(stats);

        el.salesValue.textContent = rupiah(stats.sales);
        el.salesInfo.textContent = label;
        el.transactionValue.textContent = stats.transaction_count;
        el.transactionInfo.textContent = label;
        el.incomeValue.textContent = rupiah(stats.period_income ?? stats.monthly_income);
        el.incomeInfo.textContent = label;
        el.incomeInfo.classList.remove("danger");
        el.incomeInfo.classList.add("success");
        const totalScheduled = Number(stats.total_scheduled || 0);
        el.attendanceValue.textContent = `${stats.present_count} / ${totalScheduled}`;
        el.attendanceInfo.textContent = `${stats.attendance_rate}% Kehadiran - ${label}`;
    }

    function renderChart(weeklySales = []) {
        const chart = document.querySelector(".chart-bars");
        if (!chart) return;

        if (!weeklySales.length) {
            chart.classList.add("is-empty");
            chart.innerHTML = "<div class=\"chart-empty\">Belum ada data penjualan.</div>";
            return;
        }

        const hasSales = weeklySales.some(item => Number(item.total || 0) > 0);
        chart.classList.toggle("is-empty", !hasSales);
        const maxTotal = Math.max(...weeklySales.map(item => Number(item.total || 0)), 0);

        chart.innerHTML = weeklySales.map(item => {
            const total = Number(item.total || 0);
            const ratio = maxTotal ? total / maxTotal : 0;
            const height = total > 0 ? Math.round(18 + (Math.sqrt(ratio) * 72)) : 0;
            return `
            <div class="chart-item ${total > 0 ? "has-sales" : "is-zero"}">
                <strong class="bar-value">${total > 0 ? compactRupiah(total) : "-"}</strong>
                <div class="chart-bar-track">
                    <div
                        class="bar ${total > 0 ? "has-value" : ""}"
                        style="height:${height}%"
                        title="${escapeHtml(rupiah(total))}">
                    </div>
                </div>
                <span>${escapeHtml(item.label)}</span>
            </div>
        `;
        }).join("") + (hasSales ? "" : "<div class=\"chart-empty\">Belum ada penjualan 7 hari terakhir.</div>");
    }

    function matchesSearch(values) {
        const keyword = state.search.trim().toLowerCase();
        if (!keyword) return true;
        return values.some(value => String(value ?? "").toLowerCase().includes(keyword));
    }

    function filteredTopProducts() {
        const products = state.dashboardData?.top_products || [];
        return products.filter(item => matchesSearch([
            item.name,
            item.variant,
            item.total
        ])).slice(0, 5);
    }

    function filteredTransactions() {
        const transactions = state.dashboardData?.recent_transactions || [];
        return transactions.filter(item => matchesSearch([
            item.transaction_number,
            item.customer_name,
            item.items_summary,
            item.status,
            item.total,
            item.time
        ]));
    }

    function renderTopProducts(products) {
        if (!el.topProductList) return;
        if (!products.length) {
            const message = state.search.trim()
                ? "Tidak ada produk yang cocok dengan pencarian."
                : "Belum ada penjualan produk pada periode ini.";
            el.topProductList.innerHTML = `<div class="empty-state"><p>${message}</p></div>`;
            return;
        }
        el.topProductList.innerHTML = products.slice(0, 5).map((item, index) => `
            <div class="product-item">
                <span class="product-rank">${index + 1}</span>
                ${item.image ? `<img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}">` : "<div class=\"customer-avatar\">AR</div>"}
                <div class="product-info">
                    <h4>${escapeHtml(item.name)}</h4>
                    <span>${escapeHtml(item.variant || "-")}</span>
                </div>
                <div class="product-total">
                    <h5>${item.total} Porsi</h5>
                </div>
            </div>
        `).join("");
    }

    function renderTransactions(transactions) {
        if (!el.transactionTableBody) return;
        if (!transactions.length) {
            const message = state.search.trim()
                ? "Tidak ada transaksi yang cocok dengan pencarian."
                : "Belum ada transaksi pada periode ini.";
            el.transactionTableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:32px;">${message}</td></tr>`;
            return;
        }
        el.transactionTableBody.innerHTML = transactions.map(item => `
            <tr>
                <td>#${escapeHtml(item.transaction_number)}</td>
                <td>
                    <div class="customer-info">
                        <div class="customer-avatar">${escapeHtml((item.customer_name || "U").slice(0, 2).toUpperCase())}</div>
                        <span>${escapeHtml(item.customer_name || "Umum")}</span>
                    </div>
                </td>
                <td>${escapeHtml(item.items_summary)}</td>
                <td><span class="badge success">${escapeHtml(item.status.toUpperCase())}</span></td>
                <td><strong>${rupiah(item.total)}</strong></td>
                <td>${escapeHtml(item.time)}</td>
            </tr>
        `).join("");
    }

    function renderFilteredDashboard() {
        renderTopProducts(filteredTopProducts());
        renderTransactions(filteredTransactions());
        el.clearSearch?.classList.toggle("show", Boolean(state.search.trim()));
    }

    function renderNotifications() {
        const notifications = state.notifications;
        if (el.notificationBadge) el.notificationBadge.textContent = notifications.length;
        if (el.notificationSubtitle) el.notificationSubtitle.textContent = `${notifications.length} Notifikasi Aktif`;
        if (el.stockAlertText) {
            const hasStockWarning = notifications.length > 0;

            setStockAlertState(hasStockWarning);

            if (state.stockAlertTimer) {
                clearInterval(state.stockAlertTimer);
                state.stockAlertTimer = null;
            }

            if (!hasStockWarning) {
                state.stockAlertIndex = 0;
                el.stockAlertText.textContent = "Semua stok aman";
            } else {
                const rotateStockAlert = () => {
                    const item = notifications[state.stockAlertIndex % notifications.length];
                    el.stockAlertText.textContent = stockAlertMessage(item);
                    state.stockAlertIndex++;
                };

                rotateStockAlert();
                state.stockAlertTimer = setInterval(rotateStockAlert, 3000);

            }

        }
        if (!el.notificationList) return;
        if (!notifications.length) {
            el.notificationList.innerHTML = "<div class=\"notification-empty\"><i class=\"bi bi-check-circle-fill\"></i><span>Tidak ada notifikasi.</span></div>";
            if (el.notificationFooter) el.notificationFooter.style.display = "none";
            return;
        }
        el.notificationList.innerHTML = notifications.slice(0, 3).map(item => `
            <div class="notification-item">
                <div class="notification-icon"><i class="bi bi-exclamation-triangle-fill"></i></div>
                <div class="notification-info">
                    <h5>Stok ${escapeHtml(item.product)} Menipis</h5>
                    <span>Sisa: ${escapeHtml(item.stock)}</span>
                    <small>${escapeHtml(item.time)}</small>
                </div>
            </div>
        `).join("");
        if (el.notificationFooter) el.notificationFooter.style.display = notifications.length > 3 ? "block" : "none";
    }

    function renderAllNotifications() {
        if (!el.allNotificationList) return;
        el.allNotificationCount.textContent = `${state.notifications.length} Notifikasi`;
        if (!state.notifications.length) {
            el.allNotificationList.innerHTML = "<p>Tidak ada stok menipis.</p>";
            return;
        }
        el.allNotificationList.innerHTML = state.notifications.map(item => `
            <div class="notification-card">
                <div class="notification-card-icon"><i class="bi bi-exclamation-triangle-fill"></i></div>
                <div class="notification-card-info">
                    <h4>Stok ${escapeHtml(item.product)} Menipis</h4>
                    <span>Sisa: ${escapeHtml(item.stock)}</span>
                    <small>Minimum: ${escapeHtml(item.minimum_stock)}</small>
                </div>
            </div>
        `).join("");
    }

    function updateTransactionTime() {
        if (!el.transactionUpdateTime) return;
        const now = new Date();
        el.transactionUpdateTime.textContent = `Terakhir diperbarui: ${now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`;
    }

    async function loadDashboard(filter = state.filter) {
        state.filter = filter;
        const result = await api("/api/dashboard", {
            method: "POST",
            body: JSON.stringify({
                filter,
                start_date: el.startDate?.value || "",
                end_date: el.endDate?.value || ""
            })
        });
        const data = result.data;
        state.dashboardData = data;
        updateStatistics(data.statistics);
        renderChart(data.weekly_sales || []);
        renderFilteredDashboard();
        state.notifications = data.notifications || [];
        renderNotifications();
        updateTransactionTime();
    }

    function closeProfileModal() {
        el.editProfileModal?.classList.remove("show");
    }

    function openProfileModal() {
        if (!state.user) return;
        if (el.editFullname) el.editFullname.value = state.user.fullname || "";
        if (el.editUsername) el.editUsername.value = state.user.username || "";
        if (el.editEmail) el.editEmail.value = state.user.email || "";
        if (el.editPhone) el.editPhone.value = state.user.phone || "";
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

        state.user = {
            ...state.user,
            ...result.user,
            role: state.user?.role
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

    function canManageAccounts() {
        return String(state.user?.role || "").toUpperCase() === "OWNER";
    }

    function resetAccountForm() {
        if (el.accountId) el.accountId.value = "";
        if (el.accountFullname) el.accountFullname.value = "";
        if (el.accountUsername) el.accountUsername.value = "";
        if (el.accountEmail) el.accountEmail.value = "";
        if (el.accountPhone) el.accountPhone.value = "";
        if (el.accountRole) el.accountRole.value = "FINANCE";
        if (el.accountPassword) {
            el.accountPassword.value = "";
            el.accountPassword.placeholder = "Wajib saat tambah akun";
        }
        if (el.saveAccount) el.saveAccount.textContent = "Simpan Akun";
    }

    function renderAccounts() {
        if (!el.accountList) return;
        if (el.accountCount) el.accountCount.textContent = `${state.accounts.length} akun`;

        if (!state.accounts.length) {
            el.accountList.innerHTML = "<p>Belum ada akun finance atau kasir.</p>";
            return;
        }

        el.accountList.innerHTML = state.accounts.map(account => `
            <div class="account-item" data-id="${account.id}">
                <div class="account-info">
                    <h5>${escapeHtml(account.fullname)}</h5>
                    <p>@${escapeHtml(account.username)} &bull; ${escapeHtml(account.email || "-")}</p>
                    <span class="account-badge ${account.is_active ? "" : "inactive"}">
                        ${escapeHtml(account.role)} - ${account.is_active ? "Aktif" : "Nonaktif"}
                    </span>
                </div>
                <div class="account-actions">
                    <button class="edit-account" type="button" data-action="edit">Edit</button>
                    <button class="toggle-account" type="button" data-action="toggle">
                        ${account.is_active ? "Nonaktifkan" : "Aktifkan"}
                    </button>
                </div>
            </div>
        `).join("");
    }

    async function loadAccounts() {
        if (!canManageAccounts()) return;
        const result = await api("/api/accounts");
        state.accounts = result.data || [];
        renderAccounts();
    }

    function openAccountsModal() {
        if (!canManageAccounts()) return;
        el.settingsMenu?.classList.remove("active");
        resetAccountForm();
        el.accountsModal?.classList.add("show");
        loadAccounts().catch(error => alert(error.message));
    }

    function closeAccountsModal() {
        el.accountsModal?.classList.remove("show");
        resetAccountForm();
    }

    function fillAccountForm(account) {
        if (el.accountId) el.accountId.value = account.id;
        if (el.accountFullname) el.accountFullname.value = account.fullname || "";
        if (el.accountUsername) el.accountUsername.value = account.username || "";
        if (el.accountEmail) el.accountEmail.value = account.email || "";
        if (el.accountPhone) el.accountPhone.value = account.phone || "";
        if (el.accountRole) el.accountRole.value = account.role || "FINANCE";
        if (el.accountPassword) {
            el.accountPassword.value = "";
            el.accountPassword.placeholder = "Kosongkan jika tidak diganti";
        }
        if (el.saveAccount) el.saveAccount.textContent = "Update Akun";
    }

    async function saveManagedAccount() {
        const accountId = el.accountId?.value || "";
        const payload = {
            fullname: el.accountFullname?.value.trim() || "",
            username: el.accountUsername?.value.trim() || "",
            email: el.accountEmail?.value.trim() || "",
            phone: el.accountPhone?.value.trim() || "",
            role: el.accountRole?.value || "FINANCE",
            password: el.accountPassword?.value || ""
        };

        if (!payload.fullname || !payload.username || (!accountId && !payload.password)) {
            alert("Nama, username, dan password wajib diisi untuk akun baru");
            return;
        }

        const url = accountId ? `/api/accounts/${accountId}` : "/api/accounts";
        const method = accountId ? "PUT" : "POST";
        const result = await api(url, {
            method,
            body: JSON.stringify(payload)
        });
        alert(result.message || "Akun berhasil disimpan");
        resetAccountForm();
        await loadAccounts();
    }

    async function toggleManagedAccount(account) {
        const action = account.is_active ? "menonaktifkan" : "mengaktifkan";
        if (!confirm(`Yakin ${action} akun ${account.fullname}?`)) return;
        const result = await api(`/api/accounts/${account.id}/toggle`, {
            method: "PATCH",
            body: JSON.stringify({ is_active: !account.is_active })
        });
        alert(result.message || "Status akun berhasil diperbarui");
        await loadAccounts();
    }

    function bindInteractions() {
        el.todayBtn?.addEventListener("click", () => {
            setActiveFilter(el.todayBtn);
            el.dashboardPeriod.textContent = "Selamat datang kembali. Berikut adalah performa kedai hari ini.";
            loadDashboard("today").catch(error => alert(error.message));
        });
        el.weekBtn?.addEventListener("click", () => {
            setActiveFilter(el.weekBtn);
            el.dashboardPeriod.textContent = "Berikut performa operasional selama minggu ini.";
            loadDashboard("week").catch(error => alert(error.message));
        });
        el.monthBtn?.addEventListener("click", () => {
            setActiveFilter(el.monthBtn);
            el.dashboardPeriod.textContent = "Berikut performa operasional selama bulan ini.";
            loadDashboard("month").catch(error => alert(error.message));
        });
        el.filterBtn?.addEventListener("click", () => {
            try {
                const { start, end } = validateCustomDate();
                setActiveFilter(null);
                el.dashboardPeriod.textContent = `Periode ${formatDate(start)} sampai ${formatDate(end)}`;
                loadDashboard("custom").catch(error => alert(error.message));
            } catch (error) {
                alert(error.message);
            }
        });
        el.dashboardSearch?.addEventListener("input", event => {
            state.search = event.target.value;
            renderFilteredDashboard();
        });
        el.clearSearch?.addEventListener("click", () => {
            state.search = "";
            if (el.dashboardSearch) el.dashboardSearch.value = "";
            renderFilteredDashboard();
        });
        el.notificationBtn?.addEventListener("click", event => {
            event.stopPropagation();
            el.settingsMenu?.classList.remove("active");
            el.notificationMenu?.classList.toggle("active");
        });
        el.settingBtn?.addEventListener("click", event => {
            event.stopPropagation();
            el.notificationMenu?.classList.remove("active");
            el.settingsMenu?.classList.toggle("active");
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
        el.closeProfileModal?.addEventListener("click", closeProfileModal);
        el.cancelProfile?.addEventListener("click", closeProfileModal);
        el.saveProfile?.addEventListener("click", () => {
            saveProfile().catch(error => alert(error.message));
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
        el.manageAccountsBtn?.addEventListener("click", event => {
            event.preventDefault();
            openAccountsModal();
        });
        el.closeAccountsModal?.addEventListener("click", closeAccountsModal);
        el.resetAccountForm?.addEventListener("click", resetAccountForm);
        el.saveAccount?.addEventListener("click", () => {
            saveManagedAccount().catch(error => alert(error.message));
        });
        el.accountList?.addEventListener("click", event => {
            const button = event.target.closest("[data-action]");
            if (!button) return;
            const row = button.closest(".account-item");
            const account = state.accounts.find(item => String(item.id) === row?.dataset.id);
            if (!account) return;
            if (button.dataset.action === "edit") {
                fillAccountForm(account);
                return;
            }
            if (button.dataset.action === "toggle") {
                toggleManagedAccount(account).catch(error => alert(error.message));
            }
        });
        el.editProfileModal?.addEventListener("click", event => {
            if (event.target === el.editProfileModal) {
                closeProfileModal();
            }
        });
        el.passwordModal?.addEventListener("click", event => {
            if (event.target === el.passwordModal) {
                closePasswordModal();
            }
        });
        el.accountsModal?.addEventListener("click", event => {
            if (event.target === el.accountsModal) {
                closeAccountsModal();
            }
        });
        document.getElementById("viewAllNotification")?.addEventListener("click", event => {
            event.preventDefault();
            renderAllNotifications();
            el.notificationMenu?.classList.remove("active");
            el.notificationModal?.classList.add("show");
        });
        const closeNotification = () => el.notificationModal?.classList.remove("show");
        el.closeNotificationModal?.addEventListener("click", closeNotification);
        el.closeNotificationButton?.addEventListener("click", closeNotification);
        el.downloadReportBtn?.addEventListener("click", () => {
            const params = selectedPeriodParams();
            window.location.href = `/api/transaction/export-excel${params.toString() ? `?${params}` : ""}`;
        });
        document.querySelectorAll(".logout, .logout-setting").forEach(button => {
            button.addEventListener("click", async event => {
                event.preventDefault();
                const response = await fetch("/api/logout", { method: "POST", credentials: "include" });
                const result = await response.json().catch(() => ({}));
                window.location.href = result.redirect_url || "/";
            });
        });
    }

    await loadUser();
    bindInteractions();
    await loadDashboard("today");
    setInterval(() => loadDashboard(state.filter).catch(console.error), 30000);
});
