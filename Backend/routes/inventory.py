from flask import Blueprint, request, jsonify

from model import db, Inventory, PurchaseOrder


inventory_bp = Blueprint(
    "inventory",
    __name__
)


# ==========================
# GET ALL INVENTORY
# ==========================

@inventory_bp.route(
    "/api/inventory",
    methods=["GET"]
)
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
def add_inventory():


    data = request.json


    item = Inventory(

        nama_bahan=data["nama_bahan"],

        stok=data["stok"],

        satuan=data["satuan"],

        minimal_stok=data["minimal_stok"],

        supplier=data["supplier"]

    )


    db.session.add(item)

    db.session.commit()


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
def update_inventory(id):


    item = Inventory.query.get(id)


    if not item:

        return jsonify({

            "success": False,

            "message": "Data tidak ditemukan"

        })


    data = request.json


    item.nama_bahan = data["nama_bahan"]

    item.stok = data["stok"]

    item.satuan = data["satuan"]

    item.minimal_stok = data["minimal_stok"]

    item.supplier = data["supplier"]


    db.session.commit()


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
def delete_inventory(id):


    item = Inventory.query.get(id)


    if not item:

        return jsonify({

            "success": False,

            "message": "Data tidak ditemukan"

        })


    db.session.delete(item)

    db.session.commit()


    return jsonify({

        "success": True,

        "message": "Data inventory berhasil dihapus"

    })