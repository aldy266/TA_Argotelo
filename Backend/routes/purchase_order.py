from flask import Blueprint, jsonify, request, send_file

from model import db, PurchaseOrder

from openpyxl import Workbook

import io


purchase_order_bp = Blueprint(
    "purchase_order",
    __name__
)

# ==========================
# GET SEMUA PO
# ==========================

@purchase_order_bp.route(
    "/api/purchase-orders",
    methods=["GET"]
)
def get_purchase_orders():


    orders = PurchaseOrder.query.filter(
        PurchaseOrder.status != "SELESAI"
    ).all()


    data = []


    for order in orders:


        data.append({

            "id_po": order.id_po,

            "id_inventory": order.id_inventory,

            "nama_bahan": order.inventory.nama_bahan,

            "jumlah_order": float(order.jumlah_order),

            "supplier": order.supplier,

            "status": order.status

        })


    return jsonify({

        "success": True,

        "data": data

    })



# ==========================
# HITUNG PO PENDING
# ==========================

@purchase_order_bp.route(
    "/api/purchase-orders/pending",
    methods=["GET"]
)
def pending_order():


    total = PurchaseOrder.query.filter_by(
        status="PENDING"
    ).count()


    return jsonify({

        "success": True,

        "total": total

    })

# ==========================
# CREATE PURCHASE ORDER
# ==========================

@purchase_order_bp.route(
    "/api/purchase-orders",
    methods=["POST"]
)
def create_purchase_order():


    data = request.json


    po = PurchaseOrder(


        id_inventory =
        data["id_inventory"],


        jumlah_order =
        data["jumlah_order"],


        supplier =
        data["supplier"],


        status =
        "PENDING"


    )


    db.session.add(po)


    db.session.commit()



    return jsonify({


        "success": True,


        "message": "Purchase Order berhasil dibuat"


    })

# ==========================
# UPDATE STATUS PURCHASE ORDER
# ==========================

@purchase_order_bp.route(
    "/api/purchase-orders/<int:id>/status",
    methods=["PUT"]
)
def update_status_po(id):


    po = PurchaseOrder.query.get(id)


    if not po:


        return jsonify({


            "success": False,


            "message": "PO tidak ditemukan"


        })



    data = request.json



    po.status = data["status"]



    # Kalau barang sudah diterima
    if po.status == "SELESAI":


        po.inventory.stok = (

            po.inventory.stok
            +
            po.jumlah_order

        )


    db.session.commit()



    return jsonify({


        "success": True,


        "message": "Status PO berhasil diperbarui"


    })

# ==========================
# HISTORY STOK MASUK
# ==========================

@purchase_order_bp.route(
    "/api/purchase-orders/history",
    methods=["GET"]
)
def history_po():


    start_date = request.args.get(
        "start"
    )


    end_date = request.args.get(
        "end"
    )



    query = PurchaseOrder.query.filter_by(
        status="SELESAI"
    )



    # FILTER TANGGAL
    if start_date and end_date:


        query = query.filter(

            db.func.date(
                PurchaseOrder.updated_at
            )
            >=
            start_date,


            db.func.date(
                PurchaseOrder.updated_at
            )
            <=
            end_date

        )



    orders = query.order_by(

        PurchaseOrder.updated_at.desc()

    ).all()



    data = []



    for po in orders:


        data.append({


            "id_po":
            po.id_po,


            "nama_bahan":
            po.inventory.nama_bahan,


            "jumlah_order":
            float(po.jumlah_order),


            "satuan":
            po.inventory.satuan,


            "supplier":
            po.supplier,


            "tanggal":
            po.updated_at.strftime(
                "%d-%m-%Y %H:%M"
            )


        })



    return jsonify({


        "success": True,


        "data": data


    })

# ==========================
# EXPORT HISTORY STOCK
# ==========================

@purchase_order_bp.route(
    "/api/purchase-orders/export-history",
    methods=["GET"]
)
def export_history_stock():


    start_date = request.args.get(
        "start"
    )


    end_date = request.args.get(
        "end"
    )



    query = PurchaseOrder.query.filter_by(
        status="SELESAI"
    )



    # FILTER TANGGAL
    if start_date and end_date:


        query = query.filter(

            db.func.date(
                PurchaseOrder.updated_at
            )
            >=
            start_date,


            db.func.date(
                PurchaseOrder.updated_at
            )
            <=
            end_date

        )



    orders = query.order_by(

        PurchaseOrder.updated_at.desc()

    ).all()




    workbook = Workbook()


    sheet = workbook.active


    sheet.title = "History Stock"



    sheet.append([

        "Tanggal",

        "Nama Bahan",

        "Jumlah Masuk",

        "Satuan",

        "Supplier"

    ])




    for po in orders:


        sheet.append([


            po.updated_at.strftime(
                "%d-%m-%Y %H:%M"
            ),


            po.inventory.nama_bahan,


            float(po.jumlah_order),


            po.inventory.satuan,


            po.supplier


        ])




    file = io.BytesIO()


    workbook.save(file)


    file.seek(0)



    return send_file(

        file,

        as_attachment=True,

        download_name=
        "Laporan_History_Stock_Argotelo.xlsx",

        mimetype=
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

    )