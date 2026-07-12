document.addEventListener("DOMContentLoaded", async () => {
    "use strict";


    const table = document.getElementById("transactionTable");
    const searchInput = document.getElementById("transactionSearch");
    const logoutBtn = document.getElementById("logoutBtn");
    const periodTabs = document.getElementById("periodTabs");
    const periodInput = document.getElementById("periodInput");
    const periodLabel = document.getElementById("periodLabel");
    const periodIcon = document.getElementById("periodIcon");
    const applyPeriodBtn = document.getElementById("applyPeriodBtn");
    const resetPeriodBtn = document.getElementById("resetPeriodBtn");
    const filterResultCount = document.getElementById("filterResultCount");
    const filterPeriodText = document.getElementById("filterPeriodText");


    let transactionData = [];
    let activePeriod = "day";



    // ==========================
    // FORMAT RUPIAH
    // ==========================
    function formatRupiah(value) {

        return "Rp " + Number(value || 0)
            .toLocaleString("id-ID");

    }



    // ==========================
    // FORMAT TANGGAL
    // ==========================
    function formatTanggal(value) {

        if (!value) {
            return "-";
        }


        return new Date(value)
            .toLocaleString("id-ID");

    }


    function formatPaymentMethod(value) {

        const labels = {
            CASH: "Cash",
            CASHLESS: "Cashless",
            QRIS: "QRIS",
            EWALLET: "E-Wallet",
            DEBIT: "Debit"
        };
        const key = String(value || "").toUpperCase();

        return labels[key] || value || "-";

    }


    function parseTransactionDate(value) {

        if (!value) {
            return null;
        }

        const match = String(value).match(
            /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/
        );

        if (match) {
            const [, year, month, day, hour, minute, second] = match;

            return new Date(
                Number(year),
                Number(month) - 1,
                Number(day),
                Number(hour),
                Number(minute),
                Number(second)
            );
        }

        const parsed = new Date(value);

        return Number.isNaN(parsed.getTime()) ? null : parsed;

    }


    function pad(value) {

        return String(value).padStart(2, "0");

    }


    function dateValue(date) {

        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

    }


    function monthValue(date) {

        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;

    }


    function yearValue(date) {

        return String(date.getFullYear());

    }


    function weekValue(date) {

        const target = new Date(
            Date.UTC(
                date.getFullYear(),
                date.getMonth(),
                date.getDate()
            )
        );
        const dayNumber = target.getUTCDay() || 7;
        target.setUTCDate(target.getUTCDate() + 4 - dayNumber);
        const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
        const weekNumber = Math.ceil((((target - yearStart) / 86400000) + 1) / 7);

        return `${target.getUTCFullYear()}-W${pad(weekNumber)}`;

    }


    function formatWeekRange(value) {

        const match = String(value || "").match(/^(\d{4})-W(\d{2})$/);

        if (!match) {
            return `Minggu ${value}`;
        }

        const year = Number(match[1]);
        const week = Number(match[2]);
        const januaryFourth = new Date(year, 0, 4);
        const januaryFourthDay = januaryFourth.getDay() || 7;
        const firstMonday = new Date(januaryFourth);
        firstMonday.setDate(januaryFourth.getDate() - januaryFourthDay + 1);

        const start = new Date(firstMonday);
        start.setDate(firstMonday.getDate() + ((week - 1) * 7));

        const end = new Date(start);
        end.setDate(start.getDate() + 6);

        const startText = start.toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "short"
        });
        const endText = end.toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });

        return `${startText} - ${endText}`;

    }


    function latestTransactionDate() {

        const dates = transactionData
            .map(item => parseTransactionDate(item.created_at))
            .filter(Boolean)
            .sort((a, b) => b - a);

        return dates[0] || new Date();

    }


    function defaultPeriodValue(period) {

        const date = latestTransactionDate();

        if (period === "week") {
            return weekValue(date);
        }

        if (period === "month") {
            return monthValue(date);
        }

        if (period === "year") {
            return yearValue(date);
        }

        return dateValue(date);

    }


    function formatPeriodText() {

        const value = periodInput?.value;

        if (!value) {
            return "Semua periode";
        }

        if (activePeriod === "week") {
            return formatWeekRange(value);
        }

        if (activePeriod === "month") {
            const [year, month] = value.split("-");
            const date = new Date(Number(year), Number(month) - 1, 1);

            return date.toLocaleDateString(
                "id-ID",
                {
                    month: "long",
                    year: "numeric"
                }
            );
        }

        if (activePeriod === "year") {
            return `Tahun ${value}`;
        }

        const date = parseTransactionDate(`${value} 00:00:00`);

        return date
            ? date.toLocaleDateString("id-ID", {
                day: "2-digit",
                month: "long",
                year: "numeric"
            })
            : value;

    }


    function setPeriodMode(period, value = "") {

        activePeriod = period;

        const config = {
            day: {
                label: "Tanggal",
                type: "date",
                icon: "bi-calendar-day",
                placeholder: ""
            },
            week: {
                label: "Minggu",
                type: "week",
                icon: "bi-calendar-week",
                placeholder: ""
            },
            month: {
                label: "Bulan",
                type: "month",
                icon: "bi-calendar-month",
                placeholder: ""
            },
            year: {
                label: "Tahun",
                type: "number",
                icon: "bi-calendar3",
                placeholder: "Contoh: 2026"
            }
        }[period];

        periodTabs
            ?.querySelectorAll("[data-period]")
            .forEach(button => {
                button.classList.toggle(
                    "active",
                    button.dataset.period === period
                );
            });

        if (periodLabel) {
            periodLabel.textContent = config.label;
        }

        if (periodIcon) {
            periodIcon.className = `bi ${config.icon}`;
        }

        if (periodInput) {
            periodInput.type = config.type;
            periodInput.placeholder = config.placeholder;
            periodInput.value = value || defaultPeriodValue(period);
            periodInput.removeAttribute("min");
            periodInput.removeAttribute("max");
            periodInput.removeAttribute("step");

            if (period === "year") {
                periodInput.min = "2000";
                periodInput.max = "2100";
                periodInput.step = "1";
            }
        }

    }


    function matchesSearch(item) {

        const keyword = (searchInput?.value || "").trim().toLowerCase();

        if (!keyword) {
            return true;
        }

        return (
            String(item.transaction_number || "")
                .toLowerCase()
                .includes(keyword)
            ||
            String(item.customer_name || "")
                .toLowerCase()
                .includes(keyword)
            ||
            formatPaymentMethod(item.payment_method)
                .toLowerCase()
                .includes(keyword)
        );

    }


    function matchesPeriod(item) {

        const value = periodInput?.value;

        if (!value) {
            return true;
        }

        const date = parseTransactionDate(item.created_at);

        if (!date) {
            return false;
        }

        if (activePeriod === "week") {
            return weekValue(date) === value;
        }

        if (activePeriod === "month") {
            return monthValue(date) === value;
        }

        if (activePeriod === "year") {
            return yearValue(date) === String(value);
        }

        return dateValue(date) === value;

    }


    function applyFilters() {

        const filtered = transactionData.filter(item =>
            matchesSearch(item) && matchesPeriod(item)
        );

        renderTransaction(filtered);

        if (filterResultCount) {
            filterResultCount.textContent =
                `Menampilkan ${filtered.length} dari ${transactionData.length} transaksi`;
        }

        if (filterPeriodText) {
            filterPeriodText.textContent = formatPeriodText();
        }

    }




    // ==========================
    // TAMPILKAN DATA
    // ==========================
    function renderTransaction(data) {


        if (!data.length) {


            table.innerHTML = `
                <tr>
                    <td colspan="6" class="empty">
                        Belum ada transaksi
                    </td>
                </tr>
            `;


            return;
        }




        table.innerHTML = data.map(item => {


            return `

            <tr>


                <td>
                    <strong>
                        ${item.transaction_number}
                    </strong>
                </td>



                <td>
                    ${formatTanggal(item.created_at)}
                </td>




                <td>
                    ${item.customer_name || "Umum"}
                </td>




                <td>
                    ${formatPaymentMethod(item.payment_method)}
                </td>




                <td>
                    ${formatRupiah(item.total)}
                </td>




                <td>

                    <a 
                    href="/receipt/${item.id}"
                    target="_blank"
                    class="btn-detail">

                        Lihat Struk

                    </a>

                </td>


            </tr>

            `;


        }).join("");



    }






    // ==========================
    // AMBIL DATA DARI BACKEND
    // ==========================
    async function loadTransaction() {


        try {


            const response = await fetch(
                "/cashier/api/transaction",
                {
                    credentials: "include"
                }
            );



            const result = await response.json();




            if (!result.success) {

                throw new Error(
                    result.message
                );

            }




            transactionData = result.data || [];


            setPeriodMode(activePeriod, periodInput?.value || defaultPeriodValue(activePeriod));
            applyFilters();




        } catch (error) {


            console.error(error);


            table.innerHTML = `
                <tr>
                    <td colspan="6" class="empty">
                        Gagal mengambil transaksi
                    </td>
                </tr>
            `;


        }


    }








    // ==========================
    // SEARCH
    // ==========================
    if (searchInput) {


        searchInput.addEventListener("input", () => {


            applyFilters();


        });


    }


    periodTabs?.addEventListener("click", event => {

        const button = event.target.closest("[data-period]");

        if (!button) {
            return;
        }

        setPeriodMode(button.dataset.period);
        applyFilters();

    });


    periodInput?.addEventListener("change", applyFilters);


    applyPeriodBtn?.addEventListener("click", applyFilters);


    resetPeriodBtn?.addEventListener("click", () => {

        if (periodInput) {
            periodInput.value = "";
        }

        applyFilters();

    });


    if (logoutBtn) {

        logoutBtn.addEventListener("click", async () => {

            const response = await fetch(
                "/api/logout",
                {
                    method: "POST",
                    credentials: "include"
                }
            );

            const result = await response.json().catch(() => ({}));
            window.location.href = result.redirect_url || "/staff/login";

        });

    }






    // START
    loadTransaction();



});
