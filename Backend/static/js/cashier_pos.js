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
    const checkoutMessage = document.getElementById("checkoutMessage");
    const menuCount = document.getElementById("menuCount");
    const cashCalculator = document.getElementById("cashCalculator");
    const cashReceived = document.getElementById("cashReceived");
    const cashQuickButtons = document.getElementById("cashQuickButtons");
    const cashResult = document.getElementById("cashResult");
    const cashChange = document.getElementById("cashChange");
    const cashHint = document.getElementById("cashHint");

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

    function compactRupiah(value) {
        return rupiah(value).replace("Rp", "").trim();
    }

    function numericValue(value) {
        return Number(String(value || "").replace(/[^\d]/g, "")) || 0;
    }

    function getCartTotals() {
        const items = Array.from(cart.values());
        const subtotal = items.reduce((sum, item) => sum + Number(item.menu.price) * item.quantity, 0);
        const tax = Math.round(subtotal * 0.10);
        return {
            items,
            subtotal,
            tax,
            total: subtotal + tax
        };
    }

    function formatCashInput() {
        if (!cashReceived) return;
        const value = numericValue(cashReceived.value);
        cashReceived.value = value ? new Intl.NumberFormat("id-ID").format(value) : "";
    }

    function suggestedCashAmounts(total) {
        if (!total) return [20000, 50000, 100000];
        const suggestions = new Set([total]);
        [5000, 10000, 20000, 50000].forEach(step => {
            suggestions.add(Math.ceil(total / step) * step);
        });
        return [...suggestions]
            .filter(value => value >= total)
            .sort((a, b) => a - b)
            .slice(0, 6);
    }

    function renderCashQuickButtons(total) {
        if (!cashQuickButtons) return;
        cashQuickButtons.innerHTML = suggestedCashAmounts(total).map(amount => `
            <button type="button" data-cash="${amount}">
                ${amount === total ? "Uang Pas" : compactRupiah(amount)}
            </button>
        `).join("");
    }

    function updateCheckoutButton(total = getCartTotals().total) {
        const hasItems = cart.size > 0;
        const hasCustomerName = customerName.value.trim().length > 0;
        const paid = numericValue(cashReceived?.value);
        const cashInsufficient = paymentMethod === "CASH" && hasItems && paid < total;
        checkoutBtn.disabled = !hasItems || !hasCustomerName || cashInsufficient;
    }

    function updateCashCalculator() {
        if (!cashCalculator) return;
        const { total } = getCartTotals();
        const isCash = paymentMethod === "CASH";
        cashCalculator.hidden = !isCash;
        renderCashQuickButtons(total);

        if (!isCash) {
            updateCheckoutButton(total);
            return;
        }

        const paid = numericValue(cashReceived?.value);
        const change = Math.max(paid - total, 0);
        const shortage = Math.max(total - paid, 0);
        if (cashChange) cashChange.textContent = rupiah(change);
        cashResult?.classList.toggle("negative", shortage > 0 && paid > 0);
        if (cashHint) {
            cashHint.classList.toggle("error", shortage > 0 && paid > 0);
            if (!cart.size) {
                cashHint.textContent = "Pilih menu untuk mulai menghitung.";
            } else if (!paid) {
                cashHint.textContent = "Masukkan nominal uang pelanggan.";
            } else if (shortage > 0) {
                cashHint.textContent = `Uang kurang ${rupiah(shortage)}.`;
            } else {
                cashHint.textContent = "Uang cukup. Kembalian siap diberikan.";
            }
        }
        updateCheckoutButton(total);
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
    }

    async function loadMenus() {
        const result = await api("/api/pos/menu");
        menus = result.data || [];
        renderCategoryOptions();
        renderMenus();
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
        const { items, subtotal, tax, total } = getCartTotals();
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

        subtotalEl.textContent = rupiah(subtotal);
        taxEl.textContent = rupiah(tax);
        totalEl.textContent = rupiah(total);
        updateCashCalculator();
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
        const { total } = getCartTotals();


        if (!items.length) {

            setCheckoutMessage(
                "Keranjang masih kosong",
                true
            );

            return;

        }

        const customer = customerName.value.trim();

        if (!customer) {
            customerName.classList.add("input-error");
            customerName.focus();
            setCheckoutMessage(
                "Nama pelanggan wajib diisi",
                true
            );
            updateCheckoutButton(total);
            return;
        }


        checkoutBtn.disabled = true;



        try {


            // ==========================
            // CASH = LANGSUNG CHECKOUT
            // ==========================

            if (paymentMethod === "CASH") {
                const paid = numericValue(cashReceived?.value);
                if (paid < total) {
                    setCheckoutMessage(
                        `Uang diterima kurang ${rupiah(total - paid)}`,
                        true
                    );
                    updateCashCalculator();
                    return;
                }


                const result = await api("/api/pos/checkout", {

                    method: "POST",

                    body: JSON.stringify({

                        items,

                        payment_method: paymentMethod,

                        cash_received: paid,

                        customer_name: customer

                    })

                });



                cart.clear();

                renderCart();


                customerName.value = "";
                customerName.classList.remove("input-error");
                if (cashReceived) cashReceived.value = "";
                updateCashCalculator();


                window.open(
                    `/receipt/${result.data.id}`,
                    "_blank"
                );


                return;

            }







            // ==========================
            // CASHLESS MIDTRANS
            // ==========================


            // ==========================
            // CASHLESS MIDTRANS
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

                        total,

                        customer_name:
                            customer

                    })
                }
            );

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
                                    customer

                            })

                        }
                    );



                    cart.clear();

                    renderCart();

                    customerName.value = "";
                    customerName.classList.remove("input-error");
                    if (cashReceived) cashReceived.value = "";
                    updateCashCalculator();



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


            updateCheckoutButton();


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
        loadMenus().catch(error => setCheckoutMessage(error.message, true));
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
        button.classList.remove("payment-option--tap");
        void button.offsetWidth;
        button.classList.add("payment-option--tap");
        updateCashCalculator();

    });
    paymentOptions?.addEventListener("animationend", event => {
        const button = event.target.closest(".payment-option");
        button?.classList.remove("payment-option--tap");
    });
    cashReceived?.addEventListener("input", () => {
        formatCashInput();
        updateCashCalculator();
        setCheckoutMessage("");
    });
    cashQuickButtons?.addEventListener("click", event => {
        const button = event.target.closest("[data-cash]");
        if (!button || !cashReceived) return;
        cashReceived.value = new Intl.NumberFormat("id-ID").format(Number(button.dataset.cash || 0));
        updateCashCalculator();
        setCheckoutMessage("");
    });
    customerName?.addEventListener("input", () => {
        customerName.classList.remove("input-error");
        setCheckoutMessage("");
        updateCheckoutButton();
    });
    resetCartBtn.addEventListener("click", () => {
        cart.clear();
        customerName.value = "";
        customerName.classList.remove("input-error");
        if (cashReceived) cashReceived.value = "";
        renderCart();
        setCheckoutMessage("");
    });
    checkoutBtn.addEventListener("click", checkout);
    logoutBtn.addEventListener("click", async () => {
        const response = await fetch("/api/logout", { method: "POST", credentials: "include" });
        const result = await response.json().catch(() => ({}));
        window.location.href = result.redirect_url || "/staff/login";
    });

    await loadUser();
    await loadMenus();
    renderCart();
});
