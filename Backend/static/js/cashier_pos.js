document.addEventListener("DOMContentLoaded", async () => {
    "use strict";

    const menuGrid = document.getElementById("menuGrid");
    const cartList = document.getElementById("cartList");
    const menuSearch = document.getElementById("menuSearch");
    const categoryFilter = document.getElementById("categoryFilter");
    const paymentOptions = document.getElementById("paymentOptions");
    const customerName = document.getElementById("customerName");
    const subtotalEl = document.getElementById("subtotal");
    const taxEl = document.getElementById("tax");
    const totalEl = document.getElementById("total");
    const checkoutBtn = document.getElementById("checkoutBtn");
    const resetCartBtn = document.getElementById("resetCartBtn");
    const refreshBtn = document.getElementById("refreshBtn");
    const logoutBtn = document.getElementById("logoutBtn");
    const cashierName = document.getElementById("cashierName");
    const cashierRole = document.getElementById("cashierRole");
    const profileImage = document.getElementById("profileImage");
    const stockAlertText = document.getElementById("stockAlertText");
    const checkoutMessage = document.getElementById("checkoutMessage");
    const menuCount = document.getElementById("menuCount");

    let menus = [];
    let paymentMethod = "CASH";
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
        if (cashierRole) cashierRole.textContent = result.user.role || "KASIR";
        if (profileImage) profileImage.src = result.user.photo || "/static/images/profile.png";
    }

    async function loadMenus() {
        const result = await api("/api/pos/menu");
        menus = result.data || [];
        renderCategoryOptions();
        renderMenus();
    }

    async function loadNotifications() {
        try {
            const result = await api("/api/notification");
            const notifications = result.data || [];
            stockAlertText.textContent = notifications.length
                ? `${notifications.length} Stok Menipis`
                : "Semua stok aman";
        } catch {
            stockAlertText.textContent = "Status stok tidak tersedia";
        }
    }

    function renderCategoryOptions() {
        if (!categoryFilter) return;
        const selected = categoryFilter.value || "ALL";
        const categories = [...new Set(menus.map(menu => menu.category).filter(Boolean))]
            .sort((a, b) => a.localeCompare(b));
        categoryFilter.innerHTML = `
            <option value="ALL">Semua Kategori</option>
            ${categories.map(category => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`).join("")}
        `;
        categoryFilter.value = categories.includes(selected) ? selected : "ALL";
    }

    function renderMenus() {
        const keyword = menuSearch.value.trim().toLowerCase();
        const category = categoryFilter?.value || "ALL";
        const data = menus.filter(menu =>
            (category === "ALL" || menu.category === category) &&
            (!keyword ||
                String(menu.name || "").toLowerCase().includes(keyword) ||
                String(menu.category || "").toLowerCase().includes(keyword))
        );
        if (menuCount) menuCount.textContent = data.length;

        if (!data.length) {
            menuGrid.innerHTML = "<div class=\"empty\"><i class=\"bi bi-search\"></i>Menu tidak ditemukan.</div>";
            return;
        }

        menuGrid.innerHTML = data.map(menu => {
            const recipeReady = menu.recipe_configured === true;
            return `
                <article class="menu-card ${recipeReady ? "" : "recipe-missing"}">
                    ${menu.image_url ? `<img src="${escapeHtml(menu.image_url)}" alt="${escapeHtml(menu.name)}">` : "<div class=\"menu-placeholder\"><i class=\"bi bi-image\"></i></div>"}
                    <div class="menu-body">
                        <h3>${escapeHtml(menu.name)}</h3>
                        <div>
                            <p>${escapeHtml(menu.category)}</p>
                            <strong>${rupiah(menu.price)}</strong>
                        </div>
                        ${recipeReady ? "" : "<small class=\"recipe-warning\"><i class=\"bi bi-exclamation-circle\"></i> Resep belum diatur</small>"}
                        <button class="add-btn" type="button" data-id="${menu.id}" aria-label="Tambah ${escapeHtml(menu.name)}" ${recipeReady ? "" : "disabled"}>
                            <i class="bi bi-plus-lg"></i>
                        </button>
                    </div>
                </article>
            `;
        }).join("");
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
            cartList.innerHTML = "<div class=\"empty\"><i class=\"bi bi-cart-x\"></i>Keranjang masih kosong.<br>Pilih menu untuk memulai.</div>";
        } else {
            cartList.innerHTML = items.map(({ menu, quantity }) => `
                <div class="cart-item">
                    <div class="cart-row">
                        <div>
                            <h4>${escapeHtml(menu.name)}</h4>
                            <small>${quantity} x ${rupiah(menu.price)}</small>
                        </div>
                        <strong>${rupiah(menu.price * quantity)}</strong>
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
        const tax = Math.round(subtotal * 0.10);
        subtotalEl.textContent = rupiah(subtotal);
        taxEl.textContent = rupiah(tax);
        totalEl.textContent = rupiah(subtotal + tax);
        checkoutBtn.disabled = !items.length;
    }

    function setCheckoutMessage(message, isError = false) {
        checkoutMessage.classList.toggle("error", isError);
        checkoutMessage.innerHTML = message;
    }

    async function checkout() {

        setCheckoutMessage("");


        const items = Array.from(cart.values()).map(item => ({
            menu_item_id: item.menu.id,
            quantity: item.quantity
        }));


        if (!items.length) {

            setCheckoutMessage(
                "Keranjang masih kosong",
                true
            );

            return;

        }



        checkoutBtn.disabled = true;



        try {


            // ==========================
            // CASH = LANGSUNG CHECKOUT
            // ==========================

            if (paymentMethod === "CASH") {


                const result = await api("/api/pos/checkout", {

                    method: "POST",

                    body: JSON.stringify({

                        items,

                        payment_method: paymentMethod,

                        customer_name: customerName.value

                    })

                });



                cart.clear();

                renderCart();


                customerName.value = "";


                window.open(
                    `/receipt/${result.data.id}`,
                    "_blank"
                );


                return;

            }







            // ==========================
            // QRIS / EWALLET MIDTRANS
            // ==========================


            // ==========================
            // QRIS / EWALLET MIDTRANS
            // ==========================

            if (typeof snap === "undefined") {

                setCheckoutMessage(
                    "Midtrans Snap belum aktif",
                    true
                );

                return;
            }


            const payment = await api(
                "/cashier/api/payment/create",
                {
                    method: "POST",

                    body: JSON.stringify({

                        total: Number(
                            totalEl.textContent
                                .replace(/[^\d]/g, "")
                        ),

                        customer_name:
                            customerName.value || "Umum"

                    })
                }
            );


            console.log("TOKEN MIDTRANS:", payment.token);


            snap.pay(payment.token, {


                onSuccess: async function () {


                    const result = await api(
                        "/api/pos/checkout",
                        {

                            method: "POST",

                            body: JSON.stringify({

                                items,

                                payment_method: paymentMethod,

                                customer_name:
                                    customerName.value

                            })

                        }
                    );



                    cart.clear();

                    renderCart();

                    customerName.value = "";



                    window.open(
                        `/receipt/${result.data.id}`,
                        "_blank"
                    );


                },


                onPending: function () {


                    setCheckoutMessage(
                        "Pembayaran belum selesai",
                        true
                    );


                },


                onError: function () {


                    setCheckoutMessage(
                        "Pembayaran gagal",
                        true
                    );


                }


            });



        } catch (error) {


            setCheckoutMessage(
                error.message,
                true
            );


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
    categoryFilter?.addEventListener("change", renderMenus);
    refreshBtn?.addEventListener("click", () => {
        Promise.all([loadMenus(), loadNotifications()]).catch(error => setCheckoutMessage(error.message, true));
    });
    paymentOptions?.addEventListener("click", event => {

        const button = event.target.closest("[data-method]");

        if (!button) return;


        paymentMethod = button.dataset.method;


        console.log(
            "PAYMENT DIPILIH:",
            paymentMethod
        );


        paymentOptions
        .querySelectorAll(".payment-option")
        .forEach(item =>
            item.classList.remove("active")
        );


        button.classList.add("active");

    });
    resetCartBtn.addEventListener("click", () => {
        cart.clear();
        renderCart();
        setCheckoutMessage("");
    });
    checkoutBtn.addEventListener("click", checkout);
    logoutBtn.addEventListener("click", async () => {
        await fetch("/api/logout", { method: "POST", credentials: "include" });
        window.location.href = "/";
    });

    await loadUser();
    await Promise.all([loadMenus(), loadNotifications()]);
    renderCart();
    setInterval(loadNotifications, 30000);
});
