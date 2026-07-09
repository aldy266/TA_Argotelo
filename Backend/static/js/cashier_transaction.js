document.addEventListener("DOMContentLoaded", async () => {
    "use strict";


    const table = document.getElementById("transactionTable");
    const searchInput = document.getElementById("transactionSearch");


    let transactionData = [];



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
                    ${item.payment_method}
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


            renderTransaction(transactionData);




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


            const keyword = searchInput.value
                .toLowerCase();




            const hasil = transactionData.filter(item => {


                return (

                    String(item.transaction_number)
                        .toLowerCase()
                        .includes(keyword)

                    ||

                    String(item.customer_name)
                        .toLowerCase()
                        .includes(keyword)

                    ||

                    String(item.payment_method)
                        .toLowerCase()
                        .includes(keyword)

                );


            });




            renderTransaction(hasil);


        });


    }






    // START
    loadTransaction();



});