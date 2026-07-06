document.addEventListener("DOMContentLoaded", async () => {
    "use strict";

    const el = {
        fullname: document.getElementById("fullname"),
        role: document.getElementById("role"),
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
        notificationMenu: document.getElementById("notificationMenu")
    };

    let transactions = [];

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
                "Content-Type": "application/json",
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

    async function loadUser() {
        try {
            const result = await api("/api/me");
            el.fullname.textContent = result.user.fullname || result.user.username || "User";
            el.role.textContent = result.user.role || "User";
        } catch (error) {
            window.location.href = "/";
        }
    }

    async function loadTransactions() {
        const qs = queryString();
        const result = await api(`/api/transaction${qs ? `?${qs}` : ""}`);
        transactions = result.data || [];
        renderTransactions();
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
        });
    }

    await loadUser();
    bindEvents();
    await loadTransactions();
});
