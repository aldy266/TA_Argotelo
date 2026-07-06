// ======================================================
// OWNER MENU MANAGEMENT
// ======================================================

document.addEventListener("DOMContentLoaded", async () => {

    "use strict";

    const STORAGE_KEY = "argotelo_owner_menus";
    const ITEMS_PER_PAGE = 5;

    const menuGrid = document.getElementById("menuGrid");
    const pagination = document.getElementById("pagination");
    const searchInput = document.getElementById("menuSearch");
    const totalMenu = document.getElementById("totalMenu");
    const addMenuBtn = document.getElementById("addMenuBtn");
    const fullname = document.getElementById("fullname");
    const role = document.getElementById("role");
    const profileImage = document.getElementById("profileImage");
    const logoutBtn = document.getElementById("logoutBtn");

    let menus = loadMenus();
    let currentPage = 1;
    let keyword = "";

    function makeId() {

        if (window.crypto && typeof window.crypto.randomUUID === "function") {
            return window.crypto.randomUUID();
        }

        return `menu-${Date.now()}-${Math.random().toString(16).slice(2)}`;

    }

    function rupiah(value) {

        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 0
        }).format(Number(value || 0));

    }

    function defaultMenus() {

        return [
            {
                id: makeId(),
                name: "Singkong 3 Rasa",
                price: 27000,
                category: "Snack",
                image: ""
            },
            {
                id: makeId(),
                name: "Singkong Keju",
                price: 22000,
                category: "Snack",
                image: ""
            },
            {
                id: makeId(),
                name: "Es Teh Manis",
                price: 5000,
                category: "Minuman",
                image: ""
            },
            {
                id: makeId(),
                name: "Kopi Tubruk",
                price: 10000,
                category: "Minuman",
                image: ""
            }
        ];

    }

    function loadMenus() {

        const saved = localStorage.getItem(STORAGE_KEY);

        if (!saved) {
            return defaultMenus();
        }

        try {
            const parsed = JSON.parse(saved);
            return Array.isArray(parsed) ? parsed : defaultMenus();
        } catch (error) {
            console.error(error);
            return defaultMenus();
        }

    }

    function saveMenus() {

        localStorage.setItem(STORAGE_KEY, JSON.stringify(menus));

    }

    function filteredMenus() {

        const value = keyword.trim().toLowerCase();

        if (!value) {
            return menus;
        }

        return menus.filter(menu => {
            return menu.name.toLowerCase().includes(value)
                || menu.category.toLowerCase().includes(value);
        });

    }

    function menuImage(menu) {

        if (menu.image) {
            return `<img src="${escapeHtml(menu.image)}" alt="${escapeHtml(menu.name)}">`;
        }

        return `
            <div class="menu-placeholder">
                <i class="bi bi-image"></i>
                <span>${escapeHtml(menu.category)}</span>
            </div>
        `;

    }

    function renderMenus() {

        const data = filteredMenus();
        const totalPage = Math.max(1, Math.ceil(data.length / ITEMS_PER_PAGE));

        if (currentPage > totalPage) {
            currentPage = totalPage;
        }

        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        const pageItems = data.slice(start, start + ITEMS_PER_PAGE);

        totalMenu.textContent = menus.length;

        menuGrid.innerHTML = pageItems.map(menu => `
            <div class="menu-card" data-id="${menu.id}">
                <div class="menu-image">
                    ${menuImage(menu)}
                </div>

                <div class="menu-body">
                    <div class="menu-info">
                        <div class="menu-top">
                            <h3>${escapeHtml(menu.name)}</h3>
                            <h4>${rupiah(menu.price)}</h4>
                        </div>
                        <span>${escapeHtml(menu.category)}</span>
                    </div>

                    <div class="menu-bottom">
                        <button class="edit-btn" type="button" data-action="edit">
                            <i class="bi bi-pencil-fill"></i>
                            Edit
                        </button>

                        <button class="delete-btn" type="button" data-action="delete" aria-label="Hapus menu">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join("");

        menuGrid.insertAdjacentHTML("beforeend", `
            <button class="add-card" id="addMenuCard" type="button">
                <div class="plus">
                    <i class="bi bi-plus-lg"></i>
                </div>
                <h3>Tambah Item Baru</h3>
                <p>Klik untuk menambahkan menu baru</p>
            </button>
        `);

        if (data.length === 0) {
            menuGrid.innerHTML = `
                <div class="empty-state">
                    <i class="bi bi-search"></i>
                    <h3>Menu tidak ditemukan</h3>
                    <p>Coba gunakan kata kunci lain atau tambahkan menu baru.</p>
                </div>
                <button class="add-card" id="addMenuCard" type="button">
                    <div class="plus">
                        <i class="bi bi-plus-lg"></i>
                    </div>
                    <h3>Tambah Item Baru</h3>
                    <p>Klik untuk menambahkan menu baru</p>
                </button>
            `;
        }

        renderPagination(totalPage);

    }

    function renderPagination(totalPage) {

        pagination.innerHTML = "";

        const previous = createPageButton("prev", "<i class=\"bi bi-chevron-left\"></i>");
        previous.disabled = currentPage === 1;
        pagination.appendChild(previous);

        for (let page = 1; page <= totalPage; page += 1) {
            const button = createPageButton(String(page), String(page));
            button.classList.toggle("active", page === currentPage);
            pagination.appendChild(button);
        }

        const next = createPageButton("next", "<i class=\"bi bi-chevron-right\"></i>");
        next.disabled = currentPage === totalPage;
        pagination.appendChild(next);

    }

    function createPageButton(value, content) {

        const button = document.createElement("button");
        button.type = "button";
        button.className = "page-btn";
        button.dataset.page = value;
        button.innerHTML = content;

        return button;

    }

    function openMenuForm(menu = null) {

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
                        <input name="name" type="text" value="${escapeAttribute(menu?.name || "")}" required>
                    </label>

                    <label>
                        Kategori
                        <input name="category" type="text" value="${escapeAttribute(menu?.category || "")}" required>
                    </label>

                    <label>
                        Harga
                        <input name="price" type="number" min="0" step="500" value="${escapeAttribute(menu?.price || "")}" required>
                    </label>

                    <div class="image-input-group">
                        <label for="imageFile" class="image-file-label">
                            <i class="bi bi-image"></i>
                            Pilih Foto Produk
                            <input id="imageFile" name="imageFile" type="file" accept="image/*" style="display: none;">
                        </label>
                        <div id="imagePreview" class="image-preview">
                            ${menu?.image ? `<img src="${escapeHtml(menu.image)}" alt="Preview">` : '<span>Belum ada foto</span>'}
                        </div>
                        <input name="image" type="hidden" value="${escapeAttribute(menu?.image || "")}">
                    </div>

                    <div class="menu-form-actions">
                        <button type="button" class="cancel-btn">Batal</button>
                        <button type="submit" class="save-btn">Simpan</button>
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(modal);

        const close = () => modal.remove();
        modal.querySelector(".modal-close").addEventListener("click", close);
        modal.querySelector(".cancel-btn").addEventListener("click", close);
        modal.addEventListener("click", event => {
            if (event.target === modal) {
                close();
            }
        });

        const imageFileInput = modal.querySelector("#imageFile");
        const imagePreview = modal.querySelector("#imagePreview");
        const imageHiddenInput = modal.querySelector("input[name='image']");

        imageFileInput.addEventListener("change", event => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = e => {
                    imageHiddenInput.value = e.target.result;
                    imagePreview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
                };
                reader.readAsDataURL(file);
            }
        });

        modal.querySelector("#menuForm").addEventListener("submit", event => {

            event.preventDefault();

            const formData = new FormData(event.currentTarget);
            const payload = {
                id: menu?.id || makeId(),
                name: formData.get("name").trim(),
                category: formData.get("category").trim(),
                price: Number(formData.get("price")),
                image: imageHiddenInput.value
            };

            if (menu) {
                menus = menus.map(item => item.id === menu.id ? payload : item);
            } else {
                menus.unshift(payload);
                currentPage = 1;
            }

            saveMenus();
            renderMenus();
            close();

        });

        modal.querySelector("input[name='name']").focus();

    }

    async function loadProfile() {

        try {
            const response = await fetch("/api/me", {
                credentials: "include"
            });
            const result = await response.json();

            if (!result.success) {
                window.location.href = "/";
                return;
            }

            fullname.textContent = result.user.fullname || result.user.username || "User";
            role.textContent = result.user.role || roleName(result.user.role_id);

            if (profileImage) {
                profileImage.src = result.user.photo || profileImage.dataset.defaultSrc || "/static/images/logo.png";
                profileImage.onerror = () => {
                    profileImage.src = profileImage.dataset.defaultSrc || "/static/images/logo.png";
                };
            }

        } catch (error) {
            console.error(error);
            fullname.textContent = "User";
            role.textContent = "Owner";
        }

    }

    function roleName(roleId) {

        if (roleId === 1) {
            return "Owner";
        }

        if (roleId === 2) {
            return "Finance";
        }

        if (roleId === 3) {
            return "Kasir";
        }

        return "User";

    }

    function escapeHtml(value) {

        return String(value)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll("\"", "&quot;")
            .replaceAll("'", "&#039;");

    }

    function escapeAttribute(value) {

        return escapeHtml(value);

    }

    document.querySelectorAll(".sidebar-menu a").forEach(link => {
        link.classList.toggle("active", link.pathname === window.location.pathname);
    });

    searchInput.addEventListener("input", event => {
        keyword = event.target.value;
        currentPage = 1;
        renderMenus();
    });

    addMenuBtn.addEventListener("click", () => openMenuForm());

    menuGrid.addEventListener("click", event => {

        const addCard = event.target.closest("#addMenuCard");

        if (addCard) {
            openMenuForm();
            return;
        }

        const actionButton = event.target.closest("[data-action]");

        if (!actionButton) {
            return;
        }

        const card = actionButton.closest(".menu-card");
        const menu = menus.find(item => item.id === card.dataset.id);

        if (!menu) {
            return;
        }

        if (actionButton.dataset.action === "edit") {
            openMenuForm(menu);
            return;
        }

        if (confirm(`Hapus menu "${menu.name}"?`)) {
            menus = menus.filter(item => item.id !== menu.id);
            saveMenus();
            renderMenus();
        }

    });

    pagination.addEventListener("click", event => {

        const button = event.target.closest(".page-btn");

        if (!button || button.disabled) {
            return;
        }

        const totalPage = Math.max(1, Math.ceil(filteredMenus().length / ITEMS_PER_PAGE));

        if (button.dataset.page === "prev") {
            currentPage = Math.max(1, currentPage - 1);
        } else if (button.dataset.page === "next") {
            currentPage = Math.min(totalPage, currentPage + 1);
        } else {
            currentPage = Number(button.dataset.page);
        }

        renderMenus();

    });

    logoutBtn.addEventListener("click", async event => {

        event.preventDefault();

        try {
            await fetch("/api/logout", {
                method: "POST",
                credentials: "include"
            });
        } catch (error) {
            console.error(error);
        }

        window.location.href = "/";

    });

    await loadProfile();
    saveMenus();
    renderMenus();

});
