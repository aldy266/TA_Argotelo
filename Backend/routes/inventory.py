from decimal import Decimal, InvalidOperation

from flask import Blueprint, request, jsonify, send_file, session

from model import db, Inventory, PurchaseOrder, StockMovement
from utils.auth import role_name_required

from openpyxl import Workbook

import io


inventory_bp = Blueprint(
    "inventory",
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

    if result < 0:
        raise ValueError(f"{field_name} tidak boleh negatif")

    return result


def create_stock_movement(item, movement_type, quantity, reference_type, reference_id=None, notes=None):
    if quantity <= 0:
        return

    db.session.add(StockMovement(
        id_inventory=item.id_inventory,
        movement_type=movement_type,
        quantity=quantity,
        reference_type=reference_type,
        reference_id=reference_id,
        notes=notes,
        created_by=session.get("user_id")
    ))


# ==========================
# GET ALL INVENTORY
# ==========================

@inventory_bp.route(
    "/api/inventory",
    methods=["GET"]
)
@role_name_required("OWNER", "FINANCE", "KASIR")
def get_inventory():


    items = Inventory.query.all()


    result = []


    for item in items:


        # CEK APA ADA PO AKTIF
        po = PurchaseOrder.query.filter(

            PurchaseOrder.id_inventory
            ==
            item.id_inventory,


            PurchaseOrder.status.in_(

                [
                    "PENDING",
                    "DIKIRIM"
                ]

            )

        ).first()



        status_po = None


        if po:


            status_po = po.status



        result.append({


            "id_inventory": item.id_inventory,


            "nama_bahan": item.nama_bahan,


            "stok": float(item.stok),


            "satuan": item.satuan,


            "minimal_stok": float(item.minimal_stok),


            "supplier": item.supplier,


            "status_po": status_po


        })


    return jsonify({


        "success": True,


        "data": result


    })



# ==========================
# CREATE INVENTORY
# ==========================

@inventory_bp.route(
    "/api/inventory",
    methods=["POST"]
)
@role_name_required("OWNER", "FINANCE")
def add_inventory():


    data = request.get_json(silent=True) or {}

    required = ["nama_bahan", "stok", "satuan", "minimal_stok"]

    if any(not data.get(field) for field in required):

        return api_error(
            "Nama bahan, stok, satuan, dan minimal stok wajib diisi",
            400
        )

    try:

        stok = decimal_value(data.get("stok"), "Stok")

        minimal_stok = decimal_value(data.get("minimal_stok"), "Minimal stok")

    except ValueError as error:

        return api_error(str(error), 400)


    item = Inventory(

        nama_bahan=data["nama_bahan"].strip(),

        stok=stok,

        satuan=data["satuan"].strip(),

        minimal_stok=minimal_stok,

        supplier=(data.get("supplier") or "").strip()

    )


    try:

        db.session.add(item)

        db.session.flush()

        create_stock_movement(
            item,
            "IN",
            stok,
            "INITIAL",
            item.id_inventory,
            "Stok awal"
        )

        db.session.commit()

    except Exception:

        db.session.rollback()

        return api_error("Data inventory gagal ditambahkan", 500)


    return jsonify({

        "success": True,

        "message": "Data inventory berhasil ditambahkan"

    })



# ==========================
# UPDATE INVENTORY
# ==========================

@inventory_bp.route(
    "/api/inventory/<int:id>",
    methods=["PUT"]
)
@role_name_required("OWNER", "FINANCE")
def update_inventory(id):


    item = Inventory.query.get(id)


    if not item:

        return api_error("Data tidak ditemukan", 404)


    data = request.get_json(silent=True) or {}

    required = ["nama_bahan", "stok", "satuan", "minimal_stok"]

    if any(not data.get(field) for field in required):

        return api_error(
            "Nama bahan, stok, satuan, dan minimal stok wajib diisi",
            400
        )

    try:

        new_stok = decimal_value(data.get("stok"), "Stok")

        minimal_stok_value = decimal_value(
            data.get("minimal_stok"),
            "Minimal stok"
        )

    except ValueError as error:

        return api_error(str(error), 400)

    previous_stok = Decimal(item.stok)


    item.nama_bahan = data["nama_bahan"].strip()

    item.stok = new_stok

    item.satuan = data["satuan"].strip()

    item.minimal_stok = minimal_stok_value

    item.supplier = (data.get("supplier") or "").strip()


    try:

        diff = new_stok - previous_stok

        if diff > 0:

            create_stock_movement(
                item,
                "IN",
                diff,
                "MANUAL_ADJUSTMENT",
                item.id_inventory,
                "Penyesuaian stok"
            )

        elif diff < 0:

            create_stock_movement(
                item,
                "OUT",
                abs(diff),
                "MANUAL_ADJUSTMENT",
                item.id_inventory,
                "Penyesuaian stok"
            )

        db.session.commit()

    except Exception:

        db.session.rollback()

        return api_error("Data inventory gagal diupdate", 500)


    return jsonify({

        "success": True,

        "message": "Data inventory berhasil diupdate"

    })



# ==========================
# DELETE INVENTORY
# ==========================

@inventory_bp.route(
    "/api/inventory/<int:id>",
    methods=["DELETE"]
)
@role_name_required("OWNER", "FINANCE")
def delete_inventory(id):


    item = Inventory.query.get(id)


    if not item:

        return api_error("Data tidak ditemukan", 404)


    has_po_history = PurchaseOrder.query.filter_by(
        id_inventory=id
    ).first()


    if has_po_history:

        return api_error(
            "Inventory sudah memiliki riwayat PO dan tidak dapat dihapus",
            409
        )


    try:

        db.session.delete(item)

        db.session.commit()

    except Exception:

        db.session.rollback()

        return api_error("Data inventory gagal dihapus", 500)


    return jsonify({

        "success": True,

        "message": "Data inventory berhasil dihapus"

    })

    # ==========================
# EXPORT INVENTORY EXCEL
# ==========================

@inventory_bp.route(
    "/api/inventory/export",
    methods=["GET"]
)
@role_name_required("OWNER", "FINANCE")
def export_inventory():


    items = Inventory.query.all()



    workbook = Workbook()


    sheet = workbook.active


    sheet.title = "Inventory"



    # HEADER
    sheet.append([

        "Nama Bahan",

        "Stok",

        "Satuan",

        "Minimal Stok",

        "Supplier",

        "Status Stok"

    ])




    for item in items:



        # HITUNG STATUS
        if item.stok <= item.minimal_stok:


            status = "Kritis"



        elif item.stok <= item.minimal_stok * 2:


            status = "Menipis"



        else:


            status = "Aman"




        sheet.append([

            item.nama_bahan,


            float(item.stok),


            item.satuan,


            float(item.minimal_stok),


            item.supplier,


            status

        ])




    file = io.BytesIO()



    workbook.save(file)



    file.seek(0)




    return send_file(

        file,

        as_attachment=True,

        download_name="Laporan_Inventory_Argotelo.xlsx",

        mimetype=
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

    )
