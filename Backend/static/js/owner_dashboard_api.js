document.addEventListener("DOMContentLoaded", async () => {
    "use strict";

    const state = {
        user: null,
        filter: "today",
        notifications: []
    };

    const el = {
        fullname: document.getElementById("fullname"),
        role: document.getElementById("role"),
        profileImage: document.getElementById("profileImage"),
        todayBtn: document.getElementById("todayBtn"),
        weekBtn: document.getElementById("weekBtn"),
        monthBtn: document.getElementById("monthBtn"),
        startDate: document.getElementById("startDate"),
        endDate: document.getElementById("endDate"),
        filterBtn: document.getElementById("filterBtn"),
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
        passwordModal: document.getElementById("passwordModal"),
        changePasswordBtn: document.getElementById("changePasswordBtn"),
        closePasswordModal: document.getElementById("closePasswordModal"),
        cancelPassword: document.getElementById("cancelPassword"),
        savePassword: document.getElementById("savePassword"),
        downloadReportBtn: document.getElementById("downloadReportBtn")
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
            el.fullname.textContent = result.user.fullname || result.user.username || "User";
            el.role.textContent = result.user.role || "User";
            if (el.profileImage) {
                el.profileImage.src = result.user.photo || "/static/images/logo.png";
            }
        } catch (error) {
            window.location.href = "/";
        }
    }

    function updateStatistics(stats) {
        el.salesValue.textContent = rupiah(stats.sales);
        el.salesInfo.textContent = "Periode dipilih";
        el.transactionValue.textContent = stats.transaction_count;
        el.transactionInfo.textContent = "Transaksi selesai";
        el.incomeValue.textContent = rupiah(stats.monthly_income);
        el.incomeInfo.textContent = "Pendapatan bulan berjalan";
        el.attendanceValue.textContent = `${stats.present_count} / ${stats.total_scheduled}`;
        el.attendanceInfo.textContent = `${stats.attendance_rate}% Kehadiran`;
    }

    function renderChart(weeklySales) {
        const chart = document.querySelector(".chart-bars");
        if (!chart) return;
        chart.innerHTML = weeklySales.map(item => `
            <div class="chart-item">
                <div class="bar" style="height:${Math.max(item.percentage, 4)}%"></div>
                <span>${escapeHtml(item.label)}</span>
            </div>
        `).join("");
    }

    function renderTopProducts(products) {
        if (!el.topProductList) return;
        if (!products.length) {
            el.topProductList.innerHTML = "<div class=\"empty-state\"><p>Belum ada penjualan produk pada periode ini.</p></div>";
            return;
        }
        el.topProductList.innerHTML = products.map(item => `
            <div class="product-item">
                ${item.image ? `<img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}">` : "<div class=\"customer-avatar\">AR</div>"}
                <div class="product-info">
                    <h4>${escapeHtml(item.name)}</h4>
                    <span>${escapeHtml(item.variant || "-")}</span>
                </div>
                <div class="product-total">
                    <h5>${item.total} Porsi</h5>
                    <span class="stable">Database</span>
                </div>
            </div>
        `).join("");
    }

    function renderTransactions(transactions) {
        if (!el.transactionTableBody) return;
        if (!transactions.length) {
            el.transactionTableBody.innerHTML = "<tr><td colspan=\"6\" style=\"text-align:center;padding:32px;\">Belum ada transaksi.</td></tr>";
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

    function renderNotifications() {
        const notifications = state.notifications;
        if (el.notificationBadge) el.notificationBadge.textContent = notifications.length;
        if (el.notificationSubtitle) el.notificationSubtitle.textContent = `${notifications.length} Notifikasi Aktif`;
        if (el.stockAlertText) {
            el.stockAlertText.textContent = notifications.length
                ? `Stok ${notifications[0].product} menipis`
                : "Semua stok aman";
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
        updateStatistics(data.statistics);
        renderChart(data.weekly_sales || []);
        renderTopProducts(data.top_products || []);
        renderTransactions(data.recent_transactions || []);
        state.notifications = data.notifications || [];
        renderNotifications();
        updateTransactionTime();
    }

    function bindInteractions() {
        el.todayBtn?.addEventListener("click", () => {
            [el.todayBtn, el.weekBtn, el.monthBtn].forEach(btn => btn?.classList.remove("active"));
            el.todayBtn.classList.add("active");
            el.dashboardPeriod.textContent = "Selamat datang kembali. Berikut adalah performa kedai hari ini.";
            loadDashboard("today").catch(error => alert(error.message));
        });
        el.weekBtn?.addEventListener("click", () => {
            [el.todayBtn, el.weekBtn, el.monthBtn].forEach(btn => btn?.classList.remove("active"));
            el.weekBtn.classList.add("active");
            el.dashboardPeriod.textContent = "Berikut performa operasional selama minggu ini.";
            loadDashboard("week").catch(error => alert(error.message));
        });
        el.monthBtn?.addEventListener("click", () => {
            [el.todayBtn, el.weekBtn, el.monthBtn].forEach(btn => btn?.classList.remove("active"));
            el.monthBtn.classList.add("active");
            el.dashboardPeriod.textContent = "Berikut performa operasional selama bulan ini.";
            loadDashboard("month").catch(error => alert(error.message));
        });
        el.filterBtn?.addEventListener("click", () => {
            el.dashboardPeriod.textContent = `Periode ${el.startDate.value} sampai ${el.endDate.value}`;
            loadDashboard("custom").catch(error => alert(error.message));
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
            window.location.href = "/api/transaction/export-excel";
        });
        document.querySelectorAll(".logout, .logout-setting").forEach(button => {
            button.addEventListener("click", async event => {
                event.preventDefault();
                await fetch("/api/logout", { method: "POST", credentials: "include" });
                window.location.href = "/";
            });
        });
    }

    await loadUser();
    bindInteractions();
    await loadDashboard("today");
    setInterval(() => loadDashboard(state.filter).catch(console.error), 30000);
});
