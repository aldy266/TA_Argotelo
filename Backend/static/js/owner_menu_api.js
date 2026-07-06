document.addEventListener("DOMContentLoaded", async () => {
    "use strict";

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

    let menus = [];
    let currentPage = 1;
    let keyword = "";

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

    function filteredMenus() {
        const value = keyword.trim().toLowerCase();
        if (!value) return menus;
        return menus.filter(menu =>
            menu.name.toLowerCase().includes(value) ||
            menu.category.toLowerCase().includes(value)
        );
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

    function renderMenus() {
        const data = filteredMenus();
        const totalPage = Math.max(1, Math.ceil(data.length / ITEMS_PER_PAGE));
        if (currentPage > totalPage) currentPage = totalPage;

        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        const pageItems = data.slice(start, start + ITEMS_PER_PAGE);
        totalMenu.textContent = menus.length;

        if (!pageItems.length) {
            menuGrid.innerHTML = `
                <div class="empty-state">
                    <i class="bi bi-search"></i>
                    <h3>Menu belum tersedia</h3>
                    <p>Tambahkan menu agar POS dan transaksi dapat digunakan.</p>
                </div>
                <button class="add-card" id="addMenuCard" type="button">
                    <div class="plus"><i class="bi bi-plus-lg"></i></div>
                    <h3>Tambah Item Baru</h3>
                    <p>Klik untuk menambahkan menu baru</p>
                </button>
            `;
            renderPagination(totalPage);
            return;
        }

        menuGrid.innerHTML = pageItems.map(menu => `
            <div class="menu-card" data-id="${menu.id}">
                <div class="menu-image">${menuImage(menu)}</div>
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
                        <button class="delete-btn" type="button" data-action="delete" aria-label="Nonaktifkan menu">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join("") + `
            <button class="add-card" id="addMenuCard" type="button">
                <div class="plus"><i class="bi bi-plus-lg"></i></div>
                <h3>Tambah Item Baru</h3>
                <p>Klik untuk menambahkan menu baru</p>
            </button>
        `;

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
                    <div class="image-input-group">
                        <label for="imageFile" class="image-file-label">
                            <i class="bi bi-image"></i>
                            Pilih Foto Produk
                            <input id="imageFile" name="image_file" type="file" accept=".jpg,.jpeg,.png,.webp" style="display:none;">
                        </label>
                        <div id="imagePreview" class="image-preview">
                            ${menu?.image_url ? `<img src="${escapeHtml(menu.image_url)}" alt="Preview">` : "<span>Belum ada foto</span>"}
                        </div>
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
            if (event.target === modal) close();
        });

        const imageFileInput = modal.querySelector("#imageFile");
        const imagePreview = modal.querySelector("#imagePreview");
        imageFileInput.addEventListener("change", event => {
            const file = event.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = e => {
                imagePreview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
            };
            reader.readAsDataURL(file);
        });

        modal.querySelector("#menuForm").addEventListener("submit", async event => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            if (menu?.image_url) formData.append("image_url", menu.image_url);

            const saveButton = modal.querySelector(".save-btn");
            saveButton.disabled = true;

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
            }
        });

        modal.querySelector("input[name='name']").focus();
    }

    async function loadMenus() {
        const result = await api("/api/menu-items");
        menus = result.data || [];
        renderMenus();
    }

    async function loadProfile() {
        try {
            const result = await api("/api/me");
            fullname.textContent = result.user.fullname || result.user.username || "User";
            role.textContent = result.user.role || "Owner";
            if (profileImage) {
                profileImage.src = result.user.photo || profileImage.dataset.defaultSrc || "/static/images/logo.png";
            }
        } catch (error) {
            window.location.href = "/";
        }
    }

    searchInput.addEventListener("input", event => {
        keyword = event.target.value;
        currentPage = 1;
        renderMenus();
    });

    addMenuBtn.addEventListener("click", () => openMenuForm());

    menuGrid.addEventListener("click", async event => {
        const addCard = event.target.closest("#addMenuCard");
        if (addCard) {
            openMenuForm();
            return;
        }

        const actionButton = event.target.closest("[data-action]");
        if (!actionButton) return;

        const card = actionButton.closest(".menu-card");
        const menu = menus.find(item => String(item.id) === card.dataset.id);
        if (!menu) return;

        if (actionButton.dataset.action === "edit") {
            openMenuForm(menu);
            return;
        }

        if (!confirm(`Nonaktifkan menu "${menu.name}"?`)) return;
        try {
            await api(`/api/menu-items/${menu.id}`, { method: "DELETE" });
            await loadMenus();
        } catch (error) {
            alert(error.message);
        }
    });

    pagination.addEventListener("click", event => {
        const button = event.target.closest(".page-btn");
        if (!button || button.disabled) return;
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
        await fetch("/api/logout", { method: "POST", credentials: "include" });
        window.location.href = "/";
    });

    await loadProfile();
    await loadMenus();
});
