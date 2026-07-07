from decimal import Decimal, InvalidOperation

from flask import Blueprint, jsonify, request, send_file, session

from model import db, Inventory, PurchaseOrder, StockMovement
from utils.auth import role_name_required

from openpyxl import Workbook

import io


purchase_order_bp = Blueprint(
    "purchase_order",
    __name__
)


def api_error(message, status=400):
    return jsonify({
        "success": False,
        "message": message
    }), status


def decimal_value(value, field_name):
    try:
        result = Decimal(str(value))
    except (InvalidOperation, TypeError):
        raise ValueError(f"{field_name} tidak valid")

    if result <= 0:
        raise ValueError(f"{field_name} harus lebih dari 0")

    return result

# ==========================
# GET SEMUA PO
# ==========================

@purchase_order_bp.route(
    "/api/purchase-orders",
    methods=["GET"]
)
@role_name_required("OWNER", "FINANCE")
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
@role_name_required("OWNER", "FINANCE")
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
@role_name_required("OWNER", "FINANCE")
def create_purchase_order():


    data = request.get_json(silent=True) or {}


    if not data.get("id_inventory") or not data.get("jumlah_order"):

        return api_error("Inventory dan jumlah order wajib diisi", 400)


    inventory = Inventory.query.get(
        data.get("id_inventory")
    )


    if not inventory:

        return api_error("Inventory tidak ditemukan", 404)


    try:

        jumlah_order = decimal_value(
            data.get("jumlah_order"),
            "Jumlah order"
        )

    except ValueError as error:

        return api_error(str(error), 400)


    po = PurchaseOrder(


        id_inventory =
        inventory.id_inventory,


        jumlah_order =
        jumlah_order,


        supplier =
        (data.get("supplier") or inventory.supplier or "").strip(),


        status =
        "PENDING"


    )


    try:

        db.session.add(po)

        db.session.commit()

    except Exception:

        db.session.rollback()

        return api_error("Purchase Order gagal dibuat", 500)



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
@role_name_required("OWNER", "FINANCE")
def update_status_po(id):


    po = PurchaseOrder.query.get(id)


    if not po:


        return api_error("PO tidak ditemukan", 404)



    data = request.get_json(silent=True) or {}


    new_status = data.get("status")


    valid_status = {"PENDING", "DIKIRIM", "SELESAI"}

    if new_status not in valid_status:

        return api_error("Status PO tidak valid", 400)


    if po.status == "SELESAI":

        return api_error(
            "PO sudah selesai dan tidak dapat diterima ulang",
            409
        )


    allowed_transition = {
        "PENDING": {"DIKIRIM", "SELESAI"},
        "DIKIRIM": {"SELESAI"}
    }


    if new_status not in allowed_transition.get(po.status, set()):

        return api_error("Perubahan status PO tidak valid", 409)


    try:

        po.status = new_status


        # Kalau barang sudah diterima
        if po.status == "SELESAI":


            po.inventory.stok = (

                po.inventory.stok
                +
                po.jumlah_order

            )


            db.session.add(StockMovement(
                id_inventory=po.id_inventory,
                movement_type="IN",
                quantity=po.jumlah_order,
                reference_type="PURCHASE_ORDER",
                reference_id=po.id_po,
                notes="PO diterima",
                created_by=session.get("user_id")
            ))


        db.session.commit()

    except Exception:

        db.session.rollback()

        return api_error("Status PO gagal diperbarui", 500)



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
@role_name_required("OWNER", "FINANCE")
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
@role_name_required("OWNER", "FINANCE")
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
