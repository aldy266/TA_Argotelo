document.addEventListener("DOMContentLoaded", async () => {
    "use strict";

    async function currentUser() {
        const response = await fetch("/api/me", { credentials: "include" });
        const data = await response.json();
        if (!response.ok || data.success === false) {
            throw new Error(data.message || "Belum login");
        }
        return data.user;
    }

    function hideNavByHref(partial) {
        document.querySelectorAll(`.sidebar-menu a[href*="${partial}"]`).forEach(link => {
            link.hidden = true;
        });
    }

    function ensureCashierPosLink(nav) {
        if (!nav || nav.querySelector('a[href="/cashier/pos"]')) return;
        const link = document.createElement("a");
        link.href = "/cashier/pos";
        link.innerHTML = '<i class="bi bi-cash-register"></i><span>POS System</span>';
        nav.prepend(link);
    }

    try {
        const user = await currentUser();
        const role = String(user.role || "").toUpperCase();
        const financeRoles = ["FINANCE", "TIM_FINANCE"];
        const storeRoles = ["KASIR", "KOORDINATOR_TOKO", "TIM_TOKO"];
        const operationalRoles = [
            "HRD",
            "QC",
            "TRAINER_BD",
            "TIM_TRAINER_BD",
            "GUDANG_PENGIRIMAN",
            "TIM_GUDANG",
            "KOORDINATOR_PRODUKSI",
            "TIM_PRODUKSI",
            "KOOR_IPAL_BAHAN_BAKU",
            "TIM_IPAL_BAHAN_BAKU",
            "KOOR_PRODUK_OLAHAN",
            "TIM_PRODUK_OLAHAN"
        ];
        document.body.dataset.role = role;

        document.querySelectorAll(".owner-only").forEach(element => {
            element.hidden = role !== "OWNER";
        });

        if (financeRoles.includes(role)) {
            hideNavByHref("/owner/menu");
        }

        if (storeRoles.includes(role)) {
            const nav = document.querySelector(".sidebar-menu");
            ensureCashierPosLink(nav);
        }

        if (storeRoles.includes(role) || operationalRoles.includes(role)) {
            hideNavByHref("/owner/dashboard");
            hideNavByHref("/owner/staff");
            hideNavByHref("/owner/menu");
        }
    } catch {
        window.location.href = "/";
    }
});
