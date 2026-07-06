document.addEventListener("DOMContentLoaded", async () => {
    "use strict";

    const menuGrid = document.getElementById("menuGrid");
    const cartList = document.getElementById("cartList");
    const menuSearch = document.getElementById("menuSearch");
    const paymentMethod = document.getElementById("paymentMethod");
    const customerName = document.getElementById("customerName");
    const subtotalEl = document.getElementById("subtotal");
    const taxEl = document.getElementById("tax");
    const totalEl = document.getElementById("total");
    const checkoutBtn = document.getElementById("checkoutBtn");
    const resetCartBtn = document.getElementById("resetCartBtn");
    const logoutBtn = document.getElementById("logoutBtn");
    const cashierName = document.getElementById("cashierName");
    const checkoutMessage = document.getElementById("checkoutMessage");

    let menus = [];
    const cart = new Map();

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

    async function loadUser() {
        const result = await api("/api/me");
        cashierName.textContent = result.user.fullname || result.user.username || "Kasir";
    }

    async function loadMenus() {
        const result = await api("/api/pos/menu");
        menus = result.data || [];
        renderMenus();
    }

    function renderMenus() {
        const keyword = menuSearch.value.trim().toLowerCase();
        const data = menus.filter(menu =>
            !keyword ||
            menu.name.toLowerCase().includes(keyword) ||
            menu.category.toLowerCase().includes(keyword)
        );

        if (!data.length) {
            menuGrid.innerHTML = "<div class=\"empty\">Menu belum tersedia.</div>";
            return;
        }

        menuGrid.innerHTML = data.map(menu => `
            <article class="menu-card">
                ${menu.image_url ? `<img src="${escapeHtml(menu.image_url)}" alt="${escapeHtml(menu.name)}">` : "<div class=\"menu-placeholder\"><i class=\"bi bi-image\"></i></div>"}
                <div class="menu-body">
                    <h3>${escapeHtml(menu.name)}</h3>
                    <span>${escapeHtml(menu.category)}</span>
                    <strong>${rupiah(menu.price)}</strong>
                    <button type="button" data-id="${menu.id}">Tambah</button>
                </div>
            </article>
        `).join("");
    }

    function addToCart(menuId) {
        const menu = menus.find(item => item.id === Number(menuId));
        if (!menu) return;
        const current = cart.get(menu.id) || { menu, quantity: 0 };
        current.quantity += 1;
        cart.set(menu.id, current);
        renderCart();
    }

    function changeQuantity(menuId, delta) {
        const current = cart.get(Number(menuId));
        if (!current) return;
        current.quantity += delta;
        if (current.quantity <= 0) {
            cart.delete(Number(menuId));
        } else {
            cart.set(Number(menuId), current);
        }
        renderCart();
    }

    function renderCart() {
        const items = Array.from(cart.values());
        if (!items.length) {
            cartList.innerHTML = "<div class=\"empty\">Keranjang masih kosong.</div>";
        } else {
            cartList.innerHTML = items.map(({ menu, quantity }) => `
                <div class="cart-item">
                    <div class="cart-row">
                        <strong>${escapeHtml(menu.name)}</strong>
                        <span>${rupiah(menu.price * quantity)}</span>
                    </div>
                    <div class="cart-row">
                        <div class="qty-group">
                            <button class="qty-btn" data-action="decrease" data-id="${menu.id}" type="button">-</button>
                            <span>${quantity}</span>
                            <button class="qty-btn" data-action="increase" data-id="${menu.id}" type="button">+</button>
                        </div>
                        <button class="remove-btn" data-action="remove" data-id="${menu.id}" type="button">Hapus</button>
                    </div>
                </div>
            `).join("");
        }

        const subtotal = items.reduce((sum, item) => sum + Number(item.menu.price) * item.quantity, 0);
        subtotalEl.textContent = rupiah(subtotal);
        taxEl.textContent = rupiah(0);
        totalEl.textContent = rupiah(subtotal);
    }

    async function checkout() {
        checkoutMessage.textContent = "";
        const items = Array.from(cart.values()).map(item => ({
            menu_item_id: item.menu.id,
            quantity: item.quantity
        }));

        checkoutBtn.disabled = true;
        try {
            const result = await api("/api/pos/checkout", {
                method: "POST",
                body: JSON.stringify({
                    items,
                    payment_method: paymentMethod.value,
                    customer_name: customerName.value
                })
            });
            cart.clear();
            renderCart();
            checkoutMessage.innerHTML = `Checkout berhasil. <a href="/receipt/${result.data.id}" target="_blank">Buka struk</a>`;
        } catch (error) {
            checkoutMessage.textContent = error.message;
        } finally {
            checkoutBtn.disabled = false;
        }
    }

    menuGrid.addEventListener("click", event => {
        const button = event.target.closest("button[data-id]");
        if (button) addToCart(button.dataset.id);
    });
    cartList.addEventListener("click", event => {
        const button = event.target.closest("button[data-action]");
        if (!button) return;
        if (button.dataset.action === "increase") changeQuantity(button.dataset.id, 1);
        if (button.dataset.action === "decrease") changeQuantity(button.dataset.id, -1);
        if (button.dataset.action === "remove") {
            cart.delete(Number(button.dataset.id));
            renderCart();
        }
    });
    menuSearch.addEventListener("input", renderMenus);
    resetCartBtn.addEventListener("click", () => {
        cart.clear();
        renderCart();
    });
    checkoutBtn.addEventListener("click", checkout);
    logoutBtn.addEventListener("click", async () => {
        await fetch("/api/logout", { method: "POST", credentials: "include" });
        window.location.href = "/";
    });

    await loadUser();
    await loadMenus();
    renderCart();
});
