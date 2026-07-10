from flask import Blueprint, jsonify, request
from sqlalchemy import text
from model import db
from datetime import date, datetime


attendance_bp = Blueprint(
    "attendance",
    __name__,
    url_prefix="/api/attendance"
)


# ==========================
# LIST STAFF UNTUK DROPDOWN
# ==========================

@attendance_bp.route("/staff")
def get_staff():

    result = db.session.execute(text("""
        SELECT
            id,
            full_name,
            position
        FROM staff
        WHERE status = 'ACTIVE'
        ORDER BY full_name
    """))


    data = []

    for row in result:
        data.append({
            "id": row.id,
            "name": row.full_name,
            "position": row.position
        })


    return jsonify({
        "success": True,
        "data": data
    })



# ==========================
# ABSEN MASUK
# ==========================

@attendance_bp.route("/check-in", methods=["POST"])
def check_in():

    data = request.json

    staff_id = data["staff_id"]
    pin = data["pin"]


    # cek PIN
    staff = db.session.execute(text("""
        SELECT *
        FROM staff
        WHERE id=:id
        AND attendance_pin=:pin
    """),{
        "id": staff_id,
        "pin": pin
    }).fetchone()


    if not staff:

        return jsonify({
            "success": False,
            "message": "PIN salah"
        }),400



    today = date.today()


    # cek sudah absen
    exists = db.session.execute(text("""
        SELECT id
        FROM attendance
        WHERE staff_id=:staff_id
        AND attendance_date=:today
    """),{
        "staff_id":staff_id,
        "today":today
    }).fetchone()


    if exists:

        return jsonify({
            "success":False,
            "message":"Sudah absen masuk hari ini"
        }),400



    db.session.execute(text("""
        INSERT INTO attendance
        (
            staff_id,
            attendance_date,
            clock_in,
            status,
            created_at
        )
        VALUES
        (
            :staff_id,
            :today,
            :time,
            'PRESENT',
            NOW()
        )

    """),{
        "staff_id":staff_id,
        "today":today,
        "time":datetime.now().time()
    })


    db.session.commit()


    return jsonify({
        "success":True,
        "message":"Absen masuk berhasil"
    })




# ==========================
# ABSEN PULANG
# ==========================

@attendance_bp.route("/check-out", methods=["POST"])
def check_out():

    data=request.json


    staff_id=data["staff_id"]
    pin=data["pin"]


    staff=db.session.execute(text("""
        SELECT id
        FROM staff
        WHERE id=:id
        AND attendance_pin=:pin

    """),{
        "id":staff_id,
        "pin":pin

    }).fetchone()



    if not staff:

        return jsonify({
            "success":False,
            "message":"PIN salah"
        }),400



    today=date.today()


    result=db.session.execute(text("""
        UPDATE attendance

        SET
        clock_out=:time,
        updated_at=NOW()

        WHERE staff_id=:staff_id
        AND attendance_date=:today
        AND clock_out IS NULL

    """),{

        "time":datetime.now().time(),
        "staff_id":staff_id,
        "today":today

    })


    db.session.commit()



    if result.rowcount == 0:

        return jsonify({
            "success":False,
            "message":"Belum absen masuk / sudah pulang"
        }),400



    return jsonify({
        "success":True,
        "message":"Absen pulang berhasil"
    })