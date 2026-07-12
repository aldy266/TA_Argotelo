from flask import Blueprint, redirect, render_template, url_for, jsonify, request
from utils.auth import role_name_required
from routes.auth import verify_password
from model import db, User
from sqlalchemy import text
from utils.midtrans_service import create_payment
import time
from datetime import datetime
from zoneinfo import ZoneInfo
from routes.staff import clock_in_schedule, clock_out_schedule

cashier_bp = Blueprint(
    "cashier",
    __name__,
    url_prefix="/cashier"
)


def waktu_wib():
    return datetime.now(ZoneInfo("Asia/Jakarta"))

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

        data = request.get_json(silent=True) or {}


        customer_name = (data.get("customer_name") or "").strip()

        if not customer_name:
            return jsonify({
                "success": False,
                "message": "Nama pelanggan wajib diisi"
            }), 400

        order_id = "ARG-" + str(int(time.time()))


        token = create_payment(
            order_id,
            data["total"],
            customer_name
        )


        return jsonify({
            "success": True,
            "token": token,
            "order_id": order_id
        })


    except Exception as e:

        print("MIDTRANS ERROR:", repr(e))

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

# ==========================
# CASHIER ATTENDANCE
# ==========================

@cashier_bp.route("/attendance")
@role_name_required("KASIR")
def attendance():

    return render_template(
        "cashier_attendance.html"
    )

# ==========================
# GET STAFF ABSENSI
# ==========================

@cashier_bp.route("/api/attendance/staff")
@role_name_required("KASIR")
def attendance_staff():

    try:

        result = db.session.execute(text("""
            SELECT
                id,
                full_name,
                position
            FROM staff
            WHERE status = 'ACTIVE'
            ORDER BY full_name
        """))

        data=[]

        for row in result:

            data.append({

                "id":row.id,
                "name":row.full_name,
                "position":row.position

            })


        return jsonify({

            "success":True,
            "data":data

        })


    except Exception as e:

        return jsonify({

            "success":False,
            "message":str(e)

        }),500
    
# ==========================
# ABSEN MASUK
# ==========================

@cashier_bp.route("/api/attendance/check-in", methods=["POST"])
@role_name_required("KASIR")
def attendance_check_in():

    try:

        data = request.json

        staff_id = data.get("staff_id")
        pin = data.get("pin")

        if not staff_id or not pin:

            return jsonify({

                "success": False,
                "message": "Nama karyawan dan PIN wajib diisi"

            }),400
        
        # ==========================
        # CEK USER DARI STAFF
        # ==========================

        staff = db.session.execute(text("""
            SELECT user_id
            FROM staff
            WHERE id = :staff_id
        """), {
            "staff_id": staff_id
        }).fetchone()

        if not staff or not staff.user_id:

            return jsonify({

                "success": False,
                "message": "Akun staff belum terhubung"

            }),400


        user = User.query.get(staff.user_id)

        if not user:

            return jsonify({

                "success": False,
                "message": "User tidak ditemukan"

            }),404


        if not verify_password(pin, user.password):

            return jsonify({

                "success": False,
                "message": "PIN salah"

            }),401
            

        # ==========================
        # CARI JADWAL HARI INI
        # ==========================

        schedule = db.session.execute(text("""
            SELECT id
            FROM staff_schedules
            WHERE
                staff_id = :staff_id
                AND schedule_date = CURDATE()
        """), {
            "staff_id": staff_id
        }).fetchone()

        if not schedule:

            return jsonify({

                "success": False,
                "message": "Karyawan belum memiliki jadwal hari ini"

            }),400

        now = waktu_wib()
        
        # ==========================
        # CEK SUDAH ABSEN MASUK
        # ==========================

        attendance = db.session.execute(text("""
            SELECT id
            FROM attendance
            WHERE schedule_id = :schedule_id
        """), {
            "schedule_id": schedule.id
        }).fetchone()

        if attendance:

            return jsonify({

                "success": False,
                "message": "Karyawan sudah melakukan absen masuk"

            }),400

        attendance, error = clock_in_schedule(schedule, now)

        if error:

            message, status_code = error

            return jsonify({

                "success": False,
                "message": message

            }), status_code


        db.session.commit()


        return jsonify({

            "success": True,
            "message": "Absen masuk berhasil"

        })


    except Exception as e:

        db.session.rollback()

        return jsonify({

            "success":False,
            "message":str(e)

        }),500


# ==========================
# ABSEN PULANG
# ==========================

@cashier_bp.route("/api/attendance/check-out", methods=["POST"])
@role_name_required("KASIR")
def attendance_check_out():

    try:

        data=request.json

        staff_id=data["staff_id"]
    
        now = waktu_wib()

        # Cari jadwal hari ini
        schedule = db.session.execute(text("""
            SELECT id
            FROM staff_schedules
            WHERE
                staff_id = :staff_id
                AND schedule_date = CURDATE()
        """), {
            "staff_id": staff_id
        }).fetchone()

        if not schedule:

            return jsonify({
                "success": False,
                "message": "Karyawan belum memiliki jadwal hari ini"
            }), 400


        # Pastikan sudah absen masuk
        attendance = db.session.execute(text("""
            SELECT id, clock_out
            FROM attendance
            WHERE schedule_id = :schedule_id
        """), {
            "schedule_id": schedule.id
        }).fetchone()

        if not attendance:

            return jsonify({
                "success": False,
                "message": "Karyawan belum melakukan absen masuk"
            }), 400

        if attendance.clock_out:

            return jsonify({
                "success": False,
                "message": "Karyawan sudah melakukan absen pulang"
            }), 400


        db.session.execute(text("""
            UPDATE attendance
            SET
                clock_out = :clock_out,
                status = 'COMPLETED',
                updated_at = :updated_at
            WHERE
                schedule_id = :schedule_id
        """), {
            "schedule_id": schedule.id,
            "clock_out": now,
            "updated_at": now
        })

        db.session.commit()


        return jsonify({

            "success":True,
            "message":"Absen pulang berhasil"

        })


    except Exception as e:

        db.session.rollback()

        return jsonify({

            "success":False,
            "message":str(e)

        }),500
