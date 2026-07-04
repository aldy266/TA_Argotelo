from flask import Blueprint, jsonify, request

from model import db, PurchaseOrder


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


    orders = PurchaseOrder.query.all()


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