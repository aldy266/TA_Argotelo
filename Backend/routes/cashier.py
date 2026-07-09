from flask import Blueprint, redirect, render_template, url_for, jsonify, request
from utils.auth import role_name_required
from model import db
from sqlalchemy import text
from utils.midtrans_service import create_payment
import time

cashier_bp = Blueprint(
    "cashier",
    __name__,
    url_prefix="/cashier"
)

# ==========================
# CASHIER DASHBOARD
# ==========================

@cashier_bp.route("/dashboard")
@role_name_required("KASIR")
def dashboard():
    return redirect(url_for("cashier.pos"))


@cashier_bp.route("/pos")
@role_name_required("KASIR")
def pos():
    return render_template("cashier_dashboard.html")


@cashier_bp.route("/inventory")
@role_name_required("KASIR")
def inventory():
    return render_template("cashier_inventory.html")

@cashier_bp.route("/transaction")
@role_name_required("KASIR")
def transaction():
    return render_template("cashier_transaction.html")

# ==========================
# API RIWAYAT TRANSAKSI KASIR
# ==========================

@cashier_bp.route("/api/transaction")
@role_name_required("KASIR")
def transaction_history():

    try:

        result = db.session.execute(text("""
            SELECT
                id,
                transaction_number,
                customer_name,
                payment_method,
                total,
                created_at
            FROM transactions
            ORDER BY created_at DESC
        """))


        data = []

        for row in result:

            data.append({
                "id": row.id,
                "transaction_number": row.transaction_number,
                "customer_name": row.customer_name,
                "payment_method": row.payment_method,
                "total": float(row.total),
                "created_at": str(row.created_at)
            })


        return jsonify({
            "success": True,
            "data": data
        })


    except Exception as e:

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500
    
    # ==========================
# MIDTRANS CREATE PAYMENT
# ==========================

@cashier_bp.route("/api/payment/create", methods=["POST"])
@role_name_required("KASIR")
def create_midtrans_payment():

    try:

        print("===== MIDTRANS MASUK =====")

        data = request.json

        print(data)


        order_id = "ARG-" + str(int(time.time()))


        token = create_payment(
            order_id,
            data["total"],
            data.get("customer_name", "Umum")
        )


        print("TOKEN:", token)


        return jsonify({
            "success": True,
            "token": token,
            "order_id": order_id
        })


    except Exception as e:

        print("MIDTRANS ERROR:", e)

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500