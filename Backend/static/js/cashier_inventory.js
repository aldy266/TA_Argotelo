document.addEventListener("DOMContentLoaded", async () => {
    "use strict";

    const el = {
        search: document.getElementById("inventorySearch"),
        stockFilter: document.getElementById("stockFilter"),
        sortSelect: document.getElementById("sortSelect"),
        refreshBtn: document.getElementById("refreshBtn"),
        table: document.getElementById("inventoryTable"),
        info: document.getElementById("inventoryInfo"),
        totalItem: document.getElementById("totalItem"),
        criticalItem: document.getElementById("criticalItem"),
        safeItem: document.getElementById("safeItem"),
        stockAlertText: document.getElementById("stockAlertText"),
        cashierName: document.getElementById("cashierName"),
        cashierRole: document.getElementById("cashierRole"),
        profileImage: document.getElementById("profileImage"),
        logoutBtn: document.getElementById("logoutBtn")
    };

    const state = {
        rows: [],
        search: "",
        status: "ALL",
        sort: "low"
    };

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

    function stockStatus(item) {
        const stock = Number(item.stok || 0);
        const minimum = Number(item.minimal_stok || 0);
        if (stock <= minimum) return { text: "Kritis", className: "danger" };
        if (stock <= minimum * 2) return { text: "Menipis", className: "warning" };
        return { text: "Aman", className: "safe" };
    }

    function filteredRows() {
        const keyword = state.search.trim().toLowerCase();
        return state.rows
            .filter(item => {
                const status = stockStatus(item).className;
                const matchesKeyword = !keyword || [
                    item.nama_bahan,
                    item.satuan,
                    item.supplier
                ].some(value => String(value || "").toLowerCase().includes(keyword));
                const matchesStatus = state.status === "ALL" || status === state.status;
                return matchesKeyword && matchesStatus;
            })
            .sort((a, b) => {
                if (state.sort === "high") return Number(b.stok) - Number(a.stok);
                if (state.sort === "az") return String(a.nama_bahan).localeCompare(String(b.nama_bahan));
                return Number(a.stok) - Number(b.stok);
            });
    }

    function updateStats() {
        const critical = state.rows.filter(item => stockStatus(item).className === "danger").length;
        const safe = state.rows.filter(item => stockStatus(item).className === "safe").length;
        el.totalItem.textContent = state.rows.length;
        el.criticalItem.textContent = critical;
        el.safeItem.textContent = safe;
        el.stockAlertText.textContent = critical
            ? `${critical} stok kritis`
            : "Semua stok aman";
    }

    function render() {
        const rows = filteredRows();
        updateStats();

        if (!rows.length) {
            el.table.innerHTML = `
                <tr>
                    <td colspan="5" class="empty">
                        ${state.rows.length ? "Tidak ada inventory yang cocok dengan filter." : "Belum ada data inventory di database."}
                    </td>
                </tr>
            `;
            el.info.textContent = "Tidak ada data ditampilkan";
            return;
        }

        el.table.innerHTML = rows.map(item => {
            const status = stockStatus(item);
            return `
                <tr>
                    <td>
                        <strong>${escapeHtml(item.nama_bahan)}</strong>
                        <small>Minimal: ${Number(item.minimal_stok || 0).toLocaleString("id-ID")}</small>
                    </td>
                    <td>${Number(item.stok || 0).toLocaleString("id-ID")}</td>
                    <td>${escapeHtml(item.satuan || "-")}</td>
                    <td>${escapeHtml(item.supplier || "-")}</td>
                    <td><span class="badge ${status.className}">${status.text}</span></td>
                </tr>
            `;
        }).join("");
        el.info.textContent = `Menampilkan ${rows.length} dari ${state.rows.length} data inventory`;
    }

    async function loadUser() {
        const result = await api("/api/me");
        const user = result.user;
        el.cashierName.textContent = user.fullname || user.username || "Kasir";
        el.cashierRole.textContent = user.role || "KASIR";
        el.profileImage.src = user.photo || "/static/images/profile.png";
    }

    async function loadInventory() {
        el.info.textContent = "Memuat data inventory...";
        const result = await api("/api/inventory");
        state.rows = result.data || [];
        render();
    }

    function bindEvents() {
        el.search.addEventListener("input", event => {
            state.search = event.target.value;
            render();
        });
        el.stockFilter.addEventListener("change", event => {
            state.status = event.target.value;
            render();
        });
        el.sortSelect.addEventListener("change", event => {
            state.sort = event.target.value;
            render();
        });
        el.refreshBtn.addEventListener("click", () => {
            loadInventory().catch(error => {
                el.table.innerHTML = `<tr><td colspan="5" class="empty">${escapeHtml(error.message)}</td></tr>`;
            });
        });
        el.logoutBtn.addEventListener("click", async () => {
            await fetch("/api/logout", { method: "POST", credentials: "include" });
            window.location.href = "/";
        });
    }

    bindEvents();
    try {
        await loadUser();
        await loadInventory();
    } catch (error) {
        el.table.innerHTML = `<tr><td colspan="5" class="empty">${escapeHtml(error.message)}</td></tr>`;
        if (error.message === "Belum login") {
            window.location.href = "/";
        }
    }
});
