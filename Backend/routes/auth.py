from flask import Blueprint, request, jsonify
from model import db, User
import bcrypt

auth_bp = Blueprint(
    "auth",
    __name__
)


@auth_bp.route("/api/test")
def test():

    return jsonify({
        "success": True,
        "message": "Authentication Route Working"
    })


# ==========================
# REGISTER
# ==========================

@auth_bp.route("/api/register", methods=["POST"])
def register():

    data = request.get_json()

    if not data:
        return jsonify({
            "success": False,
            "message": "Data tidak valid"
        }), 400

    fullname = data.get("fullname")
    username = data.get("username")
    password = data.get("password")
    email = data.get("email")
    phone = data.get("phone")

    if not all([fullname, username, password, email, phone]):
        return jsonify({
            "success": False,
            "message": "Semua field wajib diisi"
        }), 400

    # cek username
    user = User.query.filter_by(username=username).first()

    # cek email
    email_exist = User.query.filter_by(email=email).first()

    if user:
        return jsonify({
            "success": False,
            "message": "Username sudah digunakan"
        }), 400

    if email_exist:
        return jsonify({
            "success": False,
            "message": "Email sudah digunakan"
        }), 400

    # hash password
    hashed = bcrypt.hashpw(
        password.encode("utf-8"),
        bcrypt.gensalt()
    ).decode("utf-8")

    new_user = User(
        role_id=3,
        fullname=fullname,
        username=username,
        password=hashed,
        email=email,
        phone=phone
    )

    try:

        db.session.add(new_user)
        db.session.commit()

        return jsonify({
            "success": True,
            "message": "Registrasi berhasil"
        })

    except Exception as e:

        db.session.rollback()

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500