document.addEventListener("DOMContentLoaded", async () => {
    "use strict";

    const ITEMS_PER_PAGE = 6;

    const $ = selector => document.querySelector(selector);
    const byId = id => document.getElementById(id);

    const el = {
        fullname: byId("fullname"),
        role: byId("role"),
        searchInput: byId("inventorySearch") || $(".search-box input"),
        clearSearch: byId("clearSearch"),
        sortSelect: byId("sort"),
        inventoryTable: byId("inventoryTable"),
        inventoryInfo: byId("inventoryInfo"),
        pagination: byId("pagination"),
        totalItem: byId("totalItem"),
        stokKritis: byId("stokKritis"),
        pendingPO: byId("pendingPO"),
        stockHistory: byId("stockHistory"),
        viewAllHistory: byId("viewAllHistory"),
        historyModal: byId("historyModal"),
        closeHistoryModal: byId("closeHistoryModal"),
        allHistoryList: byId("allHistoryList"),
        historyStartDate: byId("historyStartDate"),
        historyEndDate: byId("historyEndDate"),
        filterHistoryBtn: byId("filterHistoryBtn"),
        pendingCard: byId("pendingCard"),
        listPOModal: byId("listPOModal"),
        closeListPO: byId("closeListPO"),
        poList: byId("poList"),
        exportBtn: byId("exportBtn"),
        exportMenu: byId("exportMenu"),
        exportInventoryBtn: byId("exportInventoryBtn"),
        openExportHistory: byId("openExportHistory"),
        exportHistoryModal: byId("exportHistoryModal"),
        closeExportHistory: byId("closeExportHistory"),
        cancelExportHistory: byId("cancelExportHistory"),
        exportStartDate: byId("exportStartDate"),
        exportEndDate: byId("exportEndDate"),
        downloadHistoryBtn: byId("downloadHistoryBtn"),
        stockBtn: $(".btn-stock"),
        inventoryModal: byId("inventoryModal"),
        closeInventoryModal: byId("closeInventoryModal"),
        cancelInventory: byId("cancelInventory"),
        saveInventory: byId("saveInventory"),
        namaBahan: byId("namaBahan"),
        jumlahStok: byId("jumlahStok"),
        satuan: byId("satuan"),
        minimalStok: byId("minimalStok"),
        supplier: byId("supplier"),
        poModal: byId("poModal"),
        closePOModal: byId("closePOModal"),
        cancelPO: byId("cancelPO"),
        savePO: byId("savePO"),
        poInventoryId: byId("poInventoryId"),
        poNamaBahan: byId("poNamaBahan"),
        poJumlah: byId("poJumlah"),
        poSupplier: byId("poSupplier"),
        toast: byId("stockToast"),
        closeToast: byId("closeToast"),
        notificationBtn: byId("notificationBtn"),
        notificationMenu: byId("notificationMenu"),
        notificationBadge: byId("notificationBadge"),
        notificationSubtitle: byId("notificationSubtitle"),
        notificationList: byId("notificationList"),
        notificationFooter: byId("notificationFooter"),
        stockAlertText: byId("stockAlertText"),
        viewAllNotification: byId("viewAllNotification"),
        notificationModal: byId("notificationModal"),
        allNotificationList: byId("allNotificationList"),
        allNotificationCount: byId("allNotificationCount"),
        closeNotificationModal: byId("closeNotificationModal"),
        closeNotificationButton: byId("closeNotificationButton"),
        settingBtn: byId("settingBtn"),
        settingsMenu: byId("settingsMenu"),
        editProfileBtn: byId("editProfileBtn"),
        editProfileModal: byId("editProfileModal"),
        closeProfileModal: byId("closeProfileModal"),
        cancelProfile: byId("cancelProfile"),
        saveProfile: byId("saveProfile"),
        editFullname: byId("editFullname"),
        editUsername: byId("editUsername"),
        editEmail: byId("editEmail"),
        editPhone: byId("editPhone"),
        changePasswordBtn: byId("changePasswordBtn"),
        passwordModal: byId("passwordModal"),
        closePasswordModal: byId("closePasswordModal"),
        cancelPassword: byId("cancelPassword"),
        savePassword: byId("savePassword"),
        oldPassword: byId("oldPassword"),
        newPassword: byId("newPassword"),
        confirmPassword: byId("confirmPassword"),
        manageAccountsBtn: byId("manageAccountsBtn"),
        accountsModal: byId("accountsModal"),
        closeAccountsModal: byId("closeAccountsModal"),
        accountList: byId("accountList"),
        accountCount: byId("accountCount")
    };

    const state = {
        user: null,
        accounts: [],
        inventory: [],
        pendingOrders: [],
        history: [],
        notifications: [],
        page: 1,
        search: "",
        sort: "low",
        editingId: null,
        alertIndex: 0,
        readOnly: false
    };

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

    function showMessage(message) {
        alert(message);
    }

    function showModal(modal) {
        modal?.classList.add("show");
    }

    function hideModal(modal) {
        modal?.classList.remove("show");
    }

    function stockStatus(item) {
        const stok = Number(item.stok || 0);
        const min = Number(item.minimal_stok || 0);
        if (stok <= min) return { text: "Kritis", className: "danger" };
        if (stok <= min * 2) return { text: "Menipis", className: "warning" };
        return { text: "Aman", className: "safe" };
    }

    function filteredInventory() {
        const keyword = state.search.trim().toLowerCase();
        let rows = state.inventory.filter(item => {
            if (!keyword) return true;
            return [item.nama_bahan, item.satuan, item.supplier]
                .some(value => String(value || "").toLowerCase().includes(keyword));
        });

        rows = [...rows].sort((a, b) => {
            if (state.sort === "high") return Number(b.stok) - Number(a.stok);
            if (state.sort === "az") return String(a.nama_bahan).localeCompare(String(b.nama_bahan));
            return Number(a.stok) - Number(b.stok);
        });

        return rows;
    }

    function updateInventoryStats() {
        const critical = state.inventory.filter(item =>
            Number(item.stok) <= Number(item.minimal_stok)
        ).length;
        if (el.totalItem) el.totalItem.textContent = state.inventory.length;
        if (el.stokKritis) el.stokKritis.textContent = critical;
    }

    function applyRolePermissions() {
        const role = String(state.user?.role || "").toUpperCase();
        state.readOnly = ["KASIR", "KOORDINATOR_TOKO", "TIM_TOKO"].includes(role);
        [
            el.stockBtn,
            el.exportBtn,
            el.exportMenu,
            el.pendingCard,
            el.viewAllHistory,
            el.openExportHistory
        ].forEach(node => {
            if (node) node.hidden = state.readOnly;
        });
    }

    function renderPagination(totalRows) {
        if (!el.pagination) return;
        const totalPages = Math.max(1, Math.ceil(totalRows / ITEMS_PER_PAGE));
        state.page = Math.min(state.page, totalPages);
        el.pagination.innerHTML = "";

        const createButton = (label, page, active = false, disabled = false) => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = active ? "active" : "";
            button.innerHTML = label;
            button.disabled = disabled;
            button.addEventListener("click", () => {
                state.page = page;
                renderInventory();
            });
            return button;
        };

        el.pagination.appendChild(createButton("<i class=\"bi bi-chevron-left\"></i>", Math.max(1, state.page - 1), false, state.page === 1));
        for (let page = 1; page <= totalPages; page += 1) {
            if (page === 1 || page === totalPages || Math.abs(page - state.page) <= 1) {
                el.pagination.appendChild(createButton(String(page), page, page === state.page));
            } else if (page === state.page - 2 || page === state.page + 2) {
                const span = document.createElement("span");
                span.textContent = "...";
                el.pagination.appendChild(span);
            }
        }
        el.pagination.appendChild(createButton("<i class=\"bi bi-chevron-right\"></i>", Math.min(totalPages, state.page + 1), false, state.page === totalPages));
    }

    function renderInventory() {
        if (!el.inventoryTable) return;
        const rows = filteredInventory();
        const totalPages = Math.max(1, Math.ceil(rows.length / ITEMS_PER_PAGE));
        state.page = Math.min(Math.max(1, state.page), totalPages);
        const start = (state.page - 1) * ITEMS_PER_PAGE;
        const pageRows = rows.slice(start, start + ITEMS_PER_PAGE);

        if (!pageRows.length) {
            el.inventoryTable.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align:center;padding:32px;">Data inventory tidak ditemukan.</td>
                </tr>
            `;
        } else {
            el.inventoryTable.innerHTML = pageRows.map(item => {
                const status = stockStatus(item);
                const poBadge = item.status_po === "PENDING"
                    ? "<br><span class=\"badge po-pending\">PO Pending</span>"
                    : item.status_po === "DIKIRIM"
                        ? "<br><span class=\"badge po-send\">Dalam Pengiriman</span>"
                        : "";

                return `
                    <tr>
                        <td><strong>${escapeHtml(item.nama_bahan)}</strong></td>
                        <td>${Number(item.stok).toLocaleString("id-ID")}<br><small>MIN: ${Number(item.minimal_stok).toLocaleString("id-ID")}</small></td>
                        <td>${escapeHtml(item.satuan)}</td>
                        <td>${escapeHtml(item.supplier || "-")}</td>
                        <td><span class="badge ${status.className}">${status.text}</span>${poBadge}</td>
                        <td class="action-cell">
                            ${state.readOnly ? "<span class=\"readonly-label\">Read-only</span>" : `
                            <button class="po-btn" type="button" data-action="po" data-id="${item.id_inventory}" title="Buat PO">
                                <i class="bi bi-cart-plus"></i>
                            </button>
                            <button class="edit-btn" type="button" data-action="edit" data-id="${item.id_inventory}" title="Edit">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="delete-btn" type="button" data-action="delete" data-id="${item.id_inventory}" title="Hapus">
                                <i class="bi bi-trash"></i>
                            </button>
                            `}
                        </td>
                    </tr>
                `;
            }).join("");
        }

        if (el.inventoryInfo) {
            const end = Math.min(start + pageRows.length, rows.length);
            el.inventoryInfo.textContent = rows.length
                ? `Menampilkan ${start + 1}-${end} dari ${rows.length} data inventory`
                : "Tidak ada data inventory";
        }
        renderPagination(rows.length);
        updateInventoryStats();
    }

    async function loadInventory() {
        const result = await api("/api/inventory");
        state.inventory = result.data || [];
        renderInventory();
    }

    async function loadPendingPO() {
        if (state.readOnly) {
            if (el.pendingPO) el.pendingPO.textContent = "0";
            return;
        }
        const result = await api("/api/purchase-orders/pending");
        if (el.pendingPO) el.pendingPO.textContent = result.total || 0;
    }

    function renderHistory(list, target = el.stockHistory, limit = 2) {
        if (!target) return;
        const rows = limit ? list.slice(0, limit) : list;
        if (!rows.length) {
            target.innerHTML = `<div style="padding:20px;text-align:center;color:#8A817B;">Belum ada riwayat stok masuk.</div>`;
            return;
        }
        target.innerHTML = rows.map(item => `
            <div class="activity-item">
                <div class="activity-left">
                    <div class="activity-icon green"><i class="bi bi-arrow-down-circle"></i></div>
                    <div class="activity-info">
                        <h4>${escapeHtml(item.nama_bahan)} + ${Number(item.jumlah_order).toLocaleString("id-ID")} ${escapeHtml(item.satuan)}</h4>
                        <p>Supplier: ${escapeHtml(item.supplier || "-")}</p>
                    </div>
                </div>
                <div class="activity-right">
                    <strong>${escapeHtml(item.tanggal)}</strong>
                    <span>Sistem PO</span>
                </div>
            </div>
        `).join("");
    }

    async function loadHistoryPO(params = "") {
        if (state.readOnly) {
            state.history = [];
            renderHistory(state.history);
            return state.history;
        }
        const result = await api(`/api/purchase-orders/history${params}`);
        state.history = result.data || [];
        renderHistory(state.history);
        return state.history;
    }

    async function openPOList() {
        const result = await api("/api/purchase-orders");
        state.pendingOrders = result.data || [];
        if (!el.poList) return;
        if (!state.pendingOrders.length) {
            el.poList.innerHTML = `<div style="padding:24px;text-align:center;color:#8A817B;">Tidak ada purchase order aktif.</div>`;
        } else {
            el.poList.innerHTML = state.pendingOrders.map(po => `
                <div class="po-item">
                    <div class="po-info">
                        <h4>${escapeHtml(po.nama_bahan)}</h4>
                        <p>Jumlah Pesan: <b>${Number(po.jumlah_order).toLocaleString("id-ID")}</b></p>
                        <p>Supplier: ${escapeHtml(po.supplier || "-")}</p>
                    </div>
                    <div class="po-footer">
                        ${po.status === "PENDING" ? `
                            <span class="badge po-pending">PO Pending</span>
                            <button class="po-action-btn send" type="button" data-id="${po.id_po}" data-status="DIKIRIM">Tandai Dikirim</button>
                        ` : ""}
                        ${po.status === "DIKIRIM" ? `
                            <span class="badge po-send">Dalam Pengiriman</span>
                            <button class="po-action-btn finish" type="button" data-id="${po.id_po}" data-status="SELESAI">Terima Barang</button>
                        ` : ""}
                    </div>
                </div>
            `).join("");
        }
        showModal(el.listPOModal);
    }

    function openInventoryModal(item = null) {
        state.editingId = item?.id_inventory || null;
        if (el.namaBahan) el.namaBahan.value = item?.nama_bahan || "";
        if (el.jumlahStok) el.jumlahStok.value = item?.stok ?? "";
        if (el.satuan) el.satuan.value = item?.satuan || "";
        if (el.minimalStok) el.minimalStok.value = item?.minimal_stok ?? "";
        if (el.supplier) el.supplier.value = item?.supplier || "";
        const title = el.inventoryModal?.querySelector(".modal-header h2");
        if (title) title.textContent = item ? "Edit Inventory" : "Tambah Inventory";
        showModal(el.inventoryModal);
    }

    function closeInventoryModal() {
        state.editingId = null;
        hideModal(el.inventoryModal);
    }

    async function saveInventory() {
        const payload = {
            nama_bahan: el.namaBahan?.value.trim(),
            stok: el.jumlahStok?.value,
            satuan: el.satuan?.value.trim(),
            minimal_stok: el.minimalStok?.value,
            supplier: el.supplier?.value.trim()
        };

        const url = state.editingId ? `/api/inventory/${state.editingId}` : "/api/inventory";
        const method = state.editingId ? "PUT" : "POST";
        const result = await api(url, {
            method,
            body: JSON.stringify(payload)
        });
        showMessage(result.message || "Inventory berhasil disimpan");
        closeInventoryModal();
        await loadInventory();
        await refreshNotifications();
    }

    function openPOModal(item) {
        if (el.poInventoryId) el.poInventoryId.value = item.id_inventory;
        if (el.poNamaBahan) el.poNamaBahan.value = item.nama_bahan;
        if (el.poSupplier) el.poSupplier.value = item.supplier || "";
        if (el.poJumlah) el.poJumlah.value = "";
        showModal(el.poModal);
    }

    async function savePO() {
        if (!el.poJumlah?.value) {
            showMessage("Jumlah pesanan wajib diisi");
            return;
        }
        const result = await api("/api/purchase-orders", {
            method: "POST",
            body: JSON.stringify({
                id_inventory: el.poInventoryId?.value,
                jumlah_order: el.poJumlah.value,
                supplier: el.poSupplier?.value.trim()
            })
        });
        showMessage(result.message || "Purchase Order berhasil dibuat");
        hideModal(el.poModal);
        await loadInventory();
        await loadPendingPO();
    }

    async function refreshNotifications() {
        try {
            const result = await api("/api/notification");
            state.notifications = result.data || [];
        } catch {
            state.notifications = [];
        }
        renderNotifications();
        rotateStockAlert();
    }

    function renderNotifications() {
        const notifications = state.notifications;
        if (el.notificationBadge) el.notificationBadge.textContent = notifications.length;
        if (el.notificationSubtitle) el.notificationSubtitle.textContent = `${notifications.length} Notifikasi Aktif`;
        if (!el.notificationList) return;

        if (!notifications.length) {
            el.notificationList.innerHTML = `
                <div class="notification-empty">
                    <i class="bi bi-check-circle-fill"></i>
                    <span>Tidak ada notifikasi.</span>
                </div>
            `;
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

    function rotateStockAlert() {
        if (!el.stockAlertText) return;

        const hasStockWarning = state.notifications.length > 0;
        setStockAlertState(hasStockWarning);

        if (!hasStockWarning) {
            state.alertIndex = 0;
            el.stockAlertText.textContent = "Semua stok aman";
            return;
        }
        const item = state.notifications[state.alertIndex % state.notifications.length];
        el.stockAlertText.textContent = stockAlertMessage(item);
        state.alertIndex += 1;
    }

    function renderAllNotifications() {
        if (!el.allNotificationList) return;
        if (el.allNotificationCount) {
            el.allNotificationCount.textContent = `${state.notifications.length} Notifikasi`;
        }
        if (!state.notifications.length) {
            el.allNotificationList.innerHTML = `<div class="notification-empty"><i class="bi bi-check-circle-fill"></i><p>Tidak ada notifikasi.</p></div>`;
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

    async function loadUser() {
        try {
            const result = await api("/api/me");
            state.user = result.user;
            if (el.fullname) el.fullname.textContent = result.user.fullname || result.user.username || "User";
            if (el.role) el.role.textContent = result.user.role || "User";
            applyRolePermissions();
        } catch {
            window.location.href = "/";
        }
    }

    function openProfileModal() {
        const user = state.user || {};
        if (el.editFullname) el.editFullname.value = user.fullname || "";
        if (el.editUsername) el.editUsername.value = user.username || "";
        if (el.editEmail) el.editEmail.value = user.email || "";
        if (el.editPhone) el.editPhone.value = user.phone || "";
        el.settingsMenu?.classList.remove("active");
        showModal(el.editProfileModal);
    }

    async function saveProfile() {
        const fullname = el.editFullname?.value.trim();
        const username = el.editUsername?.value.trim();
        if (!fullname || !username) {
            showMessage("Nama lengkap dan username wajib diisi");
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
        state.user = { ...state.user, ...result.user, role: state.user?.role };
        if (el.fullname) el.fullname.textContent = state.user.fullname || state.user.username || "User";
        hideModal(el.editProfileModal);
        showMessage(result.message || "Profil berhasil diperbarui");
    }

        async function savePassword() {
            const oldPassword = el.oldPassword?.value || "";
            const newPassword = el.newPassword?.value || "";
            const confirmPassword = el.confirmPassword?.value || "";
            if (!oldPassword || !newPassword) {
                showMessage("Password lama dan password baru wajib diisi");
                return;
            }
            if (newPassword !== confirmPassword) {
                showMessage("Konfirmasi password tidak sama");
                return;
            }
            const result = await api("/api/change-password", {
                method: "POST",
                body: JSON.stringify({
                    old_password: oldPassword,
                    new_password: newPassword
                })
            });
            [el.oldPassword, el.newPassword, el.confirmPassword].forEach(input => {
                if (input) input.value = "";
            });
            hideModal(el.passwordModal);
            showMessage(result.message || "Password berhasil diperbarui");
        }

        async function loadAccounts(){

            try{

                const result = await api("/api/accounts");


                state.accounts = result.data || [];


                byId("accountCount").textContent =
                    `${state.accounts.length} akun`;


                byId("accountList").innerHTML =
                    state.accounts.map(acc=>`

                    <div class="account-item" data-id="${acc.id}">


                        <div class="account-info">


                            <h5>
                                ${escapeHtml(acc.fullname)}
                            </h5>


                            <p>
                                @${escapeHtml(acc.username)}
                            </p>


                            <span class="account-badge">

                                ${acc.role} -
                                ${acc.is_active ? "Aktif" : "Nonaktif"}

                            </span>


                        </div>



                        <div class="account-actions">


                            <button
                                type="button"
                                data-action="edit">

                                Edit

                            </button>


                            <button
                                type="button"
                                data-action="toggle">

                                ${acc.is_active ? "Nonaktifkan" : "Aktifkan"}

                            </button>


                        </div>


                    </div>

                `).join("");


            }catch(error){

                byId("accountList").innerHTML =
                "Gagal memuat akun";

            }

        }

    function bindEvents() {
        el.searchInput?.addEventListener("input", event => {
            state.search = event.target.value;
            state.page = 1;
            renderInventory();
            if (el.clearSearch) el.clearSearch.style.display = state.search ? "inline-flex" : "none";
        });
        el.clearSearch?.addEventListener("click", () => {
            state.search = "";
            if (el.searchInput) el.searchInput.value = "";
            el.clearSearch.style.display = "none";
            renderInventory();
        });
        el.sortSelect?.addEventListener("change", event => {
            state.sort = event.target.value;
            state.page = 1;
            renderInventory();
        });
        el.stockBtn?.addEventListener("click", () => openInventoryModal());
        el.closeInventoryModal?.addEventListener("click", closeInventoryModal);
        el.cancelInventory?.addEventListener("click", closeInventoryModal);
        el.saveInventory?.addEventListener("click", () => saveInventory().catch(error => showMessage(error.message)));

        el.inventoryTable?.addEventListener("click", async event => {
            if (state.readOnly) return;
            const button = event.target.closest("[data-action]");
            if (!button) return;
            const item = state.inventory.find(row => String(row.id_inventory) === button.dataset.id);
            if (!item) return;

            if (button.dataset.action === "edit") {
                openInventoryModal(item);
                return;
            }
            if (button.dataset.action === "po") {
                openPOModal(item);
                return;
            }
            if (button.dataset.action === "delete") {
                if (!confirm(`Hapus inventory "${item.nama_bahan}"?`)) return;
                try {
                    const result = await api(`/api/inventory/${item.id_inventory}`, { method: "DELETE" });
                    showMessage(result.message || "Inventory berhasil dihapus");
                    await loadInventory();
                    await refreshNotifications();
                } catch (error) {
                    showMessage(error.message);
                }
            }
        });

        el.closePOModal?.addEventListener("click", () => hideModal(el.poModal));
        el.cancelPO?.addEventListener("click", () => hideModal(el.poModal));
        el.savePO?.addEventListener("click", () => savePO().catch(error => showMessage(error.message)));

        el.pendingCard?.addEventListener("click", () => openPOList().catch(error => showMessage(error.message)));
        el.closeListPO?.addEventListener("click", () => hideModal(el.listPOModal));
        el.poList?.addEventListener("click", async event => {
            const button = event.target.closest(".po-action-btn");
            if (!button) return;
            try {
                const result = await api(`/api/purchase-orders/${button.dataset.id}/status`, {
                    method: "PUT",
                    body: JSON.stringify({ status: button.dataset.status })
                });
                showMessage(result.message || "Status PO berhasil diperbarui");
                await loadInventory();
                await loadPendingPO();
                await loadHistoryPO();
                await openPOList();
                await refreshNotifications();
            } catch (error) {
                showMessage(error.message);
            }
        });

        el.viewAllHistory?.addEventListener("click", async event => {
            event.preventDefault();
            const rows = await loadHistoryPO();
            renderHistory(rows, el.allHistoryList, 0);
            showModal(el.historyModal);
        });
        el.closeHistoryModal?.addEventListener("click", () => hideModal(el.historyModal));
        el.filterHistoryBtn?.addEventListener("click", async () => {
            if (!el.historyStartDate?.value || !el.historyEndDate?.value) {
                showMessage("Pilih tanggal terlebih dahulu");
                return;
            }
            const rows = await loadHistoryPO(`?start=${el.historyStartDate.value}&end=${el.historyEndDate.value}`);
            renderHistory(rows, el.allHistoryList, 0);
        });

        el.exportBtn?.addEventListener("click", event => {
            event.stopPropagation();
            el.exportMenu?.classList.toggle("show");
        });
        el.exportInventoryBtn?.addEventListener("click", () => {
            window.location.href = "/api/inventory/export";
        });
        el.openExportHistory?.addEventListener("click", () => {
            el.exportMenu?.classList.remove("show");
            showModal(el.exportHistoryModal);
        });
        el.closeExportHistory?.addEventListener("click", () => hideModal(el.exportHistoryModal));
        el.cancelExportHistory?.addEventListener("click", () => hideModal(el.exportHistoryModal));
        el.downloadHistoryBtn?.addEventListener("click", () => {
            if (!el.exportStartDate?.value || !el.exportEndDate?.value) {
                showMessage("Pilih tanggal laporan");
                return;
            }
            window.location.href = `/api/purchase-orders/export-history?start=${el.exportStartDate.value}&end=${el.exportEndDate.value}`;
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
            el.exportMenu?.classList.remove("show");
            el.notificationMenu?.classList.remove("active");
            el.settingsMenu?.classList.remove("active");
        });
        [el.exportMenu, el.notificationMenu, el.settingsMenu].forEach(menu => {
            menu?.addEventListener("click", event => event.stopPropagation());
        });

        el.viewAllNotification?.addEventListener("click", event => {
            event.preventDefault();
            renderAllNotifications();
            el.notificationMenu?.classList.remove("active");
            showModal(el.notificationModal);
        });
        el.closeNotificationModal?.addEventListener("click", () => hideModal(el.notificationModal));
        el.closeNotificationButton?.addEventListener("click", () => hideModal(el.notificationModal));

        el.editProfileBtn?.addEventListener("click", event => {
            event.preventDefault();
            openProfileModal();
        });
        el.closeProfileModal?.addEventListener("click", () => hideModal(el.editProfileModal));
        el.cancelProfile?.addEventListener("click", () => hideModal(el.editProfileModal));
        el.saveProfile?.addEventListener("click", () => saveProfile().catch(error => showMessage(error.message)));

        el.manageAccountsBtn?.addEventListener(
            "click",
            async event => {

                event.preventDefault();

                el.settingsMenu?.classList.remove("active");

                showModal(el.accountsModal);

                await loadAccounts();

            }
        );

        el.closeAccountsModal?.addEventListener(
            "click",
            () => {

                hideModal(el.accountsModal);

            }
        );

        el.changePasswordBtn?.addEventListener("click", event => {
            event.preventDefault();
            el.settingsMenu?.classList.remove("active");
            showModal(el.passwordModal);
        });
        el.closePasswordModal?.addEventListener("click", () => hideModal(el.passwordModal));
        el.cancelPassword?.addEventListener("click", () => hideModal(el.passwordModal));
        el.savePassword?.addEventListener("click", () => savePassword().catch(error => showMessage(error.message)));

        document.querySelectorAll(".logout, .logout-setting").forEach(button => {
            button.addEventListener("click", async event => {
                event.preventDefault();
                const response = await fetch("/api/logout", { method: "POST", credentials: "include" });
                const result = await response.json().catch(() => ({}));
                window.location.href = result.redirect_url || "/";
            });
        });

        [el.inventoryModal, el.poModal, el.listPOModal, el.historyModal, el.exportHistoryModal, el.notificationModal, el.editProfileModal, el.passwordModal].forEach(modal => {
            modal?.addEventListener("click", event => {
                if (event.target === modal) hideModal(modal);
            });
        });

        el.closeToast?.addEventListener("click", () => {
            if (el.toast) el.toast.style.display = "none";
        });

        byId("accountList")?.addEventListener("click", async event => {


            const button =
                event.target.closest("[data-action]");


            if(!button) return;


            const row =
                button.closest(".account-item");


            const account =
                state.accounts.find(
                    item => String(item.id) === row.dataset.id
                );


            if(!account) return;



            // EDIT
            if(button.dataset.action === "edit"){

                byId("accountId").value =
                    account.id;


                byId("accountFullname").value =
                    account.fullname;


                byId("accountUsername").value =
                    account.username;


                byId("accountEmail").value =
                    account.email || "";


                byId("accountPhone").value =
                    account.phone || "";


                byId("accountRole").value =
                    account.role;


            }



            // AKTIF / NONAKTIF
            if(button.dataset.action === "toggle"){


                await api(
                    `/api/accounts/${account.id}/toggle`,
                    {
                        method:"PATCH"
                    }
                );


                await loadAccounts();

            }


        });

        byId("saveAccount")?.addEventListener("click", async()=>{


            const id =
                byId("accountId").value;


            const payload = {

                fullname:
                    byId("accountFullname").value,

                username:
                    byId("accountUsername").value,

                email:
                    byId("accountEmail").value,

                phone:
                    byId("accountPhone").value,

                role:
                    byId("accountRole").value,

                password:
                    byId("accountPassword").value

            };



            // UPDATE AKUN LAMA
            if(id){


                await api(
                    `/api/accounts/${id}`,
                    {
                        method:"PUT",

                        body:
                        JSON.stringify(payload)
                    }
                );


            }


            // TAMBAH AKUN BARU
            else{


                await api(
                    "/api/accounts",
                    {
                        method:"POST",

                        body:
                        JSON.stringify(payload)
                    }
                );


            }



            // kosongkan form
            byId("accountId").value="";
            byId("accountFullname").value="";
            byId("accountUsername").value="";
            byId("accountEmail").value="";
            byId("accountPhone").value="";
            byId("accountPassword").value="";


            // reload data terbaru
            await loadAccounts();


        });




        // =========================
        // RESET FORM BARU
        // =========================
        byId("resetAccountForm")
        ?.addEventListener("click",()=>{


            byId("accountId").value="";
            byId("accountFullname").value="";
            byId("accountUsername").value="";
            byId("accountEmail").value="";
            byId("accountPhone").value="";
            byId("accountPassword").value="";


        });


        byId("satuan")
            ?.addEventListener("input", e=>{


                e.target.value =
                    e.target.value.replace(/[0-9]/g,"");


            });

        byId("satuan")
        ?.addEventListener("input", e => {

            e.target.value =
                e.target.value.replace(/[0-9]/g,"");

        });

    }

    bindEvents();
    await loadUser();
    if (state.readOnly) {
        await Promise.all([
            loadInventory(),
            refreshNotifications()
        ]);
    } else {
        await Promise.all([
            loadInventory(),
            loadPendingPO(),
            loadHistoryPO(),
            refreshNotifications()
        ]);
    }

    if (el.toast) {
        setTimeout(() => {
            el.toast.style.display = "flex";
        }, 800);
    }
    setInterval(refreshNotifications, 10000);
    setInterval(rotateStockAlert, 4000);
});
