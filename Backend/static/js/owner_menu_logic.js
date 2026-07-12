document.addEventListener("DOMContentLoaded", async () => {
    "use strict";

    const ITEMS_PER_PAGE = 6;

    const el = {
        menuGrid: document.getElementById("menuGrid"),
        pagination: document.getElementById("pagination"),
        searchInput: document.getElementById("menuSearch"),
        totalMenu: document.getElementById("totalMenu"),
        addMenuBtn: document.getElementById("addMenuBtn"),
        categoryFilter: document.getElementById("menuCategoryFilter"),
        statusFilter: document.getElementById("menuStatusFilter"),
        stockAlertText: document.getElementById("stockAlertText")
    };

    const state = {
        menus: [],
        inventory: [],
        notifications: [],
        currentPage: 1,
        keyword: "",
        category: "ALL",
        status: "ACTIVE",
        loading: false,
        alertIndex: 0
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

        if (icon) {
            icon.className = `bi ${isDanger ? "bi-exclamation-triangle-fill" : "bi-check-circle-fill"}`;
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

    function statusLabel(status) {
        return status === "INACTIVE" ? "Nonaktif" : "Aktif";
    }

    function formatQuantity(value) {
        return Number(value || 0).toLocaleString("id-ID", {
            maximumFractionDigits: 2
        });
    }

    function recipeCount(menu) {
        return Number(menu.recipe_count || (Array.isArray(menu.recipe) ? menu.recipe.length : 0));
    }

    function recipeBadge(menu) {
        const count = recipeCount(menu);
        return `
            <span class="recipe-badge ${count ? "" : "empty"}">
                <i class="bi ${count ? "bi-check2-circle" : "bi-exclamation-circle"}"></i>
                ${count ? `${count} bahan resep` : "Resep belum diatur"}
            </span>
        `;
    }

    function filteredMenus() {
        const keyword = state.keyword.trim().toLowerCase();
        return state.menus.filter(menu => {
            const matchKeyword = !keyword ||
                String(menu.name || "").toLowerCase().includes(keyword) ||
                String(menu.category || "").toLowerCase().includes(keyword) ||
                statusLabel(menu.status).toLowerCase().includes(keyword);
            const matchCategory = state.category === "ALL" || menu.category === state.category;
            const matchStatus = state.status === "ALL" || menu.status === state.status;
            return matchKeyword && matchCategory && matchStatus;
        });
    }

    function menuImage(menu) {
        if (menu.image_url) {
            return `<img src="${escapeHtml(menu.image_url)}" alt="${escapeHtml(menu.name)}">`;
        }
        return `
            <div class="menu-placeholder">
                <i class="bi bi-image"></i>
                <span>${escapeHtml(menu.category)}</span>
            </div>
        `;
    }

    function renderFilterOptions() {
        if (!el.categoryFilter) return;
        const selected = state.category;
        const categories = [...new Set(state.menus.map(menu => menu.category).filter(Boolean))]
            .sort((a, b) => a.localeCompare(b));
        el.categoryFilter.innerHTML = `
            <option value="ALL">Semua Kategori</option>
            ${categories.map(category => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`).join("")}
        `;
        el.categoryFilter.value = categories.includes(selected) ? selected : "ALL";
        state.category = el.categoryFilter.value;
    }

    function renderMenus() {
        if (!el.menuGrid || !el.pagination) return;

        if (state.loading) {
            el.menuGrid.innerHTML = `
                <div class="empty-state">
                    <i class="bi bi-arrow-repeat"></i>
                    <h3>Memuat menu</h3>
                    <p>Data menu sedang diambil dari database.</p>
                </div>
            `;
            el.pagination.innerHTML = "";
            return;
        }

        const data = filteredMenus();
        const totalPage = Math.max(1, Math.ceil(data.length / ITEMS_PER_PAGE));
        if (state.currentPage > totalPage) state.currentPage = totalPage;

        const start = (state.currentPage - 1) * ITEMS_PER_PAGE;
        const pageItems = data.slice(start, start + ITEMS_PER_PAGE);
        if (el.totalMenu) el.totalMenu.textContent = data.length;

        const cards = pageItems.map(menu => {
            const inactive = menu.status === "INACTIVE";
            return `
                <div class="menu-card ${inactive ? "inactive" : ""}" data-id="${menu.id}">
                    <div class="menu-image">${menuImage(menu)}</div>
                    <div class="menu-body">
                        <div class="menu-info">
                            <div class="menu-top">
                                <h3>${escapeHtml(menu.name)}</h3>
                                <h4>${rupiah(menu.price)}</h4>
                            </div>
                            <span>${escapeHtml(menu.category)}</span>
                            <span class="menu-status ${inactive ? "inactive" : "active"}">${statusLabel(menu.status)}</span>
                            ${recipeBadge(menu)}
                        </div>
                        <div class="menu-bottom">
                            <button class="edit-btn" type="button" data-action="edit">
                                <i class="bi bi-pencil-fill"></i>
                                Edit
                            </button>
                            <button class="${inactive ? "restore-btn" : "delete-btn"}" type="button" data-action="toggle">
                                <i class="bi ${inactive ? "bi-check2-circle" : "bi-trash"}"></i>
                                <span>${inactive ? "Aktifkan" : "Nonaktif"}</span>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join("");

        const emptyState = `
            <div class="empty-state">
                <i class="bi bi-journal-x"></i>
                <h3>Menu tidak ditemukan</h3>
                <p>Coba ubah pencarian, kategori, atau status menu.</p>
            </div>
        `;

        el.menuGrid.innerHTML = (cards || emptyState) + `
            <button class="add-card" id="addMenuCard" type="button">
                <div class="plus"><i class="bi bi-plus-lg"></i></div>
                <h3>Tambah Item Baru</h3>
                <p>Klik untuk menambahkan menu baru</p>
            </button>
        `;

        renderPagination(totalPage);
    }

    function renderPagination(totalPage) {
        if (!el.pagination) return;
        el.pagination.innerHTML = "";
        const previous = createPageButton("prev", "<i class=\"bi bi-chevron-left\"></i>");
        previous.disabled = state.currentPage === 1;
        el.pagination.appendChild(previous);

        for (let page = 1; page <= totalPage; page += 1) {
            const button = createPageButton(String(page), String(page));
            button.classList.toggle("active", page === state.currentPage);
            el.pagination.appendChild(button);
        }

        const next = createPageButton("next", "<i class=\"bi bi-chevron-right\"></i>");
        next.disabled = state.currentPage === totalPage;
        el.pagination.appendChild(next);
    }

    function createPageButton(value, content) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "page-btn";
        button.dataset.page = value;
        button.innerHTML = content;
        return button;
    }

    function inventoryOptions(selectedId) {

        if (!state.inventory.length) {

            return `<option value="">Belum ada inventory</option>`;

        }


        return `

            <option value="">Pilih bahan</option>

            ${state.inventory.map(item => `

                <option 
                    value="${item.id_inventory}"
                    ${String(selectedId || "") === String(item.id_inventory) ? "selected" : ""}
                >

                    ${escapeHtml(item.nama_bahan)}

                </option>

            `).join("")}

        `;

    }


    function stockForInventory(inventoryId) {

        const item = state.inventory.find(row =>
            String(row.id_inventory) === String(inventoryId)
        );


        if (!item) {

            return "-";

        }


        return `${formatQuantity(item.stok)} ${item.satuan}`;

    }

    function unitForInventory(inventoryId) {
        const item = state.inventory.find(row => String(row.id_inventory) === String(inventoryId));
        return item?.satuan || "unit";
    }

    function closeMenuForm(modal){
        modal.remove();
    }

    function openMenuForm(menu = null) {
        const recipeRows = Array.isArray(menu?.recipe)
            ? menu.recipe.map(row => ({
                id_inventory: String(row.id_inventory || ""),
                quantity: String(row.quantity || "")
            }))
            : [];

        const modal = document.createElement("div");
        modal.className = "menu-modal-backdrop";
        modal.innerHTML = `
            <div class="menu-modal" role="dialog" aria-modal="true">
                <div class="menu-modal-header">
                    <h2>${menu ? "Edit Menu" : "Tambah Menu Baru"}</h2>
                    <button class="modal-close" type="button" aria-label="Tutup">
                        <i class="bi bi-x-lg"></i>
                    </button>
                </div>
                <form id="menuForm" class="menu-form">
                    <label>
                        Nama Menu
                        <input name="name" type="text" value="${escapeHtml(menu?.name || "")}" required>
                    </label>
                    <label>
                        Kategori
                        <input name="category" type="text" value="${escapeHtml(menu?.category || "")}" required>
                    </label>
                    <label>
                        Harga
                        <input name="price" type="number" min="0" step="500" value="${escapeHtml(menu?.price || "")}" required>
                    </label>
                    <label>
                        Status
                        <select name="status">
                            <option value="ACTIVE" ${menu?.status !== "INACTIVE" ? "selected" : ""}>Aktif</option>
                            <option value="INACTIVE" ${menu?.status === "INACTIVE" ? "selected" : ""}>Nonaktif</option>
                        </select>
                    </label>
                    <div class="image-input-group">
                        <label for="imageFile" class="image-file-label">
                            <i class="bi bi-image"></i>
                            Pilih Foto Produk
                            <input id="imageFile" name="image_file" type="file" accept=".jpg,.jpeg,.png,.webp" hidden>
                        </label>
                        <div id="imagePreview" class="image-preview">
                            ${menu?.image_url ? `<img src="${escapeHtml(menu.image_url)}" alt="Preview">` : "<span>Belum ada foto</span>"}
                        </div>
                    </div>
                    <section class="recipe-section" aria-label="Resep menu">
                        <div class="recipe-header">
                            <div>
                                <h3>Resep Menu</h3>
                                <p>Isi jumlah bahan yang dipakai untuk 1 porsi produk.</p>
                            </div>
                            <button id="addRecipeRow" class="add-recipe-btn" type="button" ${state.inventory.length ? "" : "disabled"}>
                                <i class="bi bi-plus-lg"></i>
                                Tambah Bahan
                            </button>
                        </div>
                        <div id="recipeRows" class="recipe-rows"></div>
                    </section>
                    <div class="menu-form-actions">
                        <button type="button" class="cancel-btn">Batal</button>
                        <button type="submit" class="save-btn">Simpan</button>
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(modal);


        // =========================
        // CLOSE MODAL
        // =========================

        const close = () => {

            closeMenuForm(modal);

        };


        const closeBtn = modal.querySelector(".modal-close");

        const cancelBtn = modal.querySelector(".cancel-btn");


        closeBtn?.addEventListener("click", close);

        cancelBtn?.addEventListener("click", close);


        modal.addEventListener("click", (event) => {

            if (event.target === modal) {

                close();

            }

        });


        // =========================
        // RECIPE ELEMENT
        // =========================

        const recipeContainer = modal.querySelector("#recipeRows");

        const addRecipeBtn = modal.querySelector("#addRecipeRow");

        function renderRecipeRows() {
            if (!state.inventory.length) {
                recipeContainer.innerHTML = `
                    <div class="recipe-empty">
                        <i class="bi bi-box-seam"></i>
                        Tambahkan bahan di halaman Inventory dulu, lalu kembali untuk membuat resep.
                    </div>
                `;
                return;
            }

            if (!recipeRows.length) {
                recipeContainer.innerHTML = `
                    <div class="recipe-empty">
                        <i class="bi bi-journal-plus"></i>
                        Belum ada resep. Klik Tambah Bahan untuk menghubungkan menu ke inventory.
                    </div>
                `;
                return;
            }

            recipeContainer.innerHTML = recipeRows.map((row, index) => `
                <div class="recipe-row" data-index="${index}">
                    <label>
                        Bahan
                      <select data-field="id_inventory" required>
                            ${inventoryOptions(row.id_inventory)}
                        </select>
                        <small class="recipe-stock">
                            Stok tersedia : ${stockForInventory(row.id_inventory)}
                        </small>
                    </label>
                    <label>
                        Jumlah / porsi
                        <input data-field="quantity" type="number" min="0.01" step="0.01" value="${escapeHtml(row.quantity)}" required>
                    </label>
                    <span class="recipe-unit">${escapeHtml(unitForInventory(row.id_inventory))}</span>
                    <button class="remove-recipe-btn" type="button" data-action="remove-recipe" aria-label="Hapus bahan">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            `).join("");
        }

        addRecipeBtn?.addEventListener("click", () => {
            const firstInventory = state.inventory.find(item =>
                !recipeRows.some(row => String(row.id_inventory) === String(item.id_inventory))
            ) || state.inventory[0];

            recipeRows.push({
                id_inventory: firstInventory ? String(firstInventory.id_inventory) : "",
                quantity: ""
            });
            renderRecipeRows();
        });

        recipeContainer.addEventListener("change", event => {
            const field = event.target.dataset.field;
            const rowEl = event.target.closest(".recipe-row");
            if (!field || !rowEl) return;
            const row = recipeRows[Number(rowEl.dataset.index)];
            if (!row) return;
            row[field] = event.target.value;
            if (field === "id_inventory") renderRecipeRows();
        });

        recipeContainer.addEventListener("input", event => {
            const field = event.target.dataset.field;
            const rowEl = event.target.closest(".recipe-row");
            if (!field || !rowEl) return;
            const row = recipeRows[Number(rowEl.dataset.index)];
            if (!row) return;
            row[field] = event.target.value;
        });

        recipeContainer.addEventListener("click", event => {
            const removeButton = event.target.closest("[data-action='remove-recipe']");
            if (!removeButton) return;
            const rowEl = removeButton.closest(".recipe-row");
            recipeRows.splice(Number(rowEl.dataset.index), 1);
            renderRecipeRows();
        });

        renderRecipeRows();

        const imageFileInput = modal.querySelector("#imageFile");
        const imagePreview = modal.querySelector("#imagePreview");
        imageFileInput.addEventListener("change", event => {
            const file = event.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = fileEvent => {
                imagePreview.innerHTML = `<img src="${fileEvent.target.result}" alt="Preview">`;
            };
            reader.readAsDataURL(file);
        });

        modal.querySelector("#menuForm").addEventListener("submit", async event => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            if (menu?.image_url) formData.append("image_url", menu.image_url);
            formData.append("recipe", JSON.stringify(
                recipeRows
                    .filter(row => row.id_inventory && Number(row.quantity) > 0)
                    .map(row => ({
                        id_inventory: Number(row.id_inventory),
                        quantity: row.quantity
                    }))
            ));

            const saveButton = modal.querySelector(".save-btn");
            saveButton.disabled = true;
            saveButton.textContent = "Menyimpan...";

            try {
                if (menu) {
                    await api(`/api/menu-items/${menu.id}`, { method: "PUT", body: formData });
                } else {
                    await api("/api/menu-items", { method: "POST", body: formData });
                }
                await loadMenus();
                close();
            } catch (error) {
                alert(error.message);
            } finally {
                saveButton.disabled = false;
                saveButton.textContent = "Simpan";
            }
        });

        modal.querySelector("input[name='name']").focus();
    }

    async function toggleMenuStatus(menu) {
        const inactive = menu.status === "INACTIVE";
        const message = inactive
            ? `Aktifkan kembali menu "${menu.name}"?`
            : `Nonaktifkan menu "${menu.name}"? Menu nonaktif tidak tampil di POS.`;
        if (!confirm(message)) return;

        if (inactive) {
            const formData = new FormData();
            formData.append("name", menu.name);
            formData.append("category", menu.category);
            formData.append("price", menu.price);
            formData.append("status", "ACTIVE");
            if (menu.image_url) formData.append("image_url", menu.image_url);
            await api(`/api/menu-items/${menu.id}`, { method: "PUT", body: formData });
        } else {
            await api(`/api/menu-items/${menu.id}`, { method: "DELETE" });
        }

        await loadMenus();
    }

    async function loadMenus() {
        state.loading = true;
        renderMenus();
        try {
            const result = await api("/api/menu-items?include_inactive=1");
            state.menus = result.data || [];
            renderFilterOptions();
        } catch (error) {
            el.menuGrid.innerHTML = `
                <div class="empty-state">
                    <i class="bi bi-exclamation-triangle"></i>
                    <h3>Menu gagal dimuat</h3>
                    <p>${escapeHtml(error.message)}</p>
                </div>
            `;
        } finally {
            state.loading = false;
            renderMenus();
        }
    }

    async function loadInventory() {
        try {
            const result = await api("/api/inventory");
            state.inventory = (result.data || []).sort((a, b) =>
                String(a.nama_bahan || "").localeCompare(String(b.nama_bahan || ""))
            );
        } catch {
            state.inventory = [];
        }
    }

    async function loadNotifications() {
        try {
            const result = await api("/api/notification");
            state.notifications = result.data || [];
        } catch {
            state.notifications = [];
        }

        rotateStockAlert();
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

    function bindEvents() {
        el.searchInput?.addEventListener("input", event => {
            state.keyword = event.target.value;
            state.currentPage = 1;
            renderMenus();
        });

        el.categoryFilter?.addEventListener("change", event => {
            state.category = event.target.value;
            state.currentPage = 1;
            renderMenus();
        });

        el.statusFilter?.addEventListener("change", event => {
            state.status = event.target.value;
            state.currentPage = 1;
            renderMenus();
        });

        el.addMenuBtn?.addEventListener("click", () => openMenuForm());

        el.menuGrid?.addEventListener("click", async event => {
            const addCard = event.target.closest("#addMenuCard");
            if (addCard) {
                openMenuForm();
                return;
            }

            const actionButton = event.target.closest("[data-action]");
            if (!actionButton) return;

            const card = actionButton.closest(".menu-card");
            const menu = state.menus.find(item => String(item.id) === card?.dataset.id);
            if (!menu) return;

            try {
                if (actionButton.dataset.action === "edit") {
                    openMenuForm(menu);
                    return;
                }
                if (actionButton.dataset.action === "toggle") {
                    await toggleMenuStatus(menu);
                }
            } catch (error) {
                alert(error.message);
            }
        });

        el.pagination?.addEventListener("click", event => {
            const button = event.target.closest(".page-btn");
            if (!button || button.disabled) return;
            const totalPage = Math.max(1, Math.ceil(filteredMenus().length / ITEMS_PER_PAGE));
            if (button.dataset.page === "prev") {
                state.currentPage = Math.max(1, state.currentPage - 1);
            } else if (button.dataset.page === "next") {
                state.currentPage = Math.min(totalPage, state.currentPage + 1);
            } else {
                state.currentPage = Number(button.dataset.page);
            }
            renderMenus();
        });
    }

    bindEvents();
    await Promise.all([loadInventory(), loadMenus(), loadNotifications()]);
    setInterval(loadNotifications, 30000);
    setInterval(rotateStockAlert, 4000);
});
