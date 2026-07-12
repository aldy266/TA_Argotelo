from flask import (
    Blueprint,
    redirect,
    request,
    jsonify,
    session,
    render_template,
    current_app
)

from model import Role, db, User
from utils.roles import FINANCE_ROLE_CODES, OPERATIONAL_ROLE_CODES, login_destination
from utils.staff_profiles import ensure_staff_profile_for_user

import bcrypt

import secrets

import re

from datetime import datetime, timedelta

from utils.email_service import send_reset_email

from datetime import datetime

from utils.auth import role_name_required

MANAGED_ACCOUNT_ROLES = FINANCE_ROLE_CODES | OPERATIONAL_ROLE_CODES
EMAIL_PATTERN = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
FORGOT_PASSWORD_SUCCESS_MESSAGE = (
    "Link reset password berhasil dikirim. Silakan cek email atau folder spam."
)
FORGOT_PASSWORD_ERROR_MESSAGE = (
    "Email reset password belum bisa dikirim. Coba lagi nanti atau hubungi admin."
)

auth_bp = Blueprint(
    "auth",
    __name__
)


def api_success(message="Berhasil", data=None, status=200):
    payload = {
        "success": True,
        "message": message
    }
    if data is not None:
        payload["data"] = data
    return jsonify(payload), status


def api_error(message, status=400):
    return jsonify({
        "success": False,
        "message": message
    }), status


def verify_password(password, stored_hash):
    if not password or not stored_hash:
        return False

    try:
        return bcrypt.checkpw(
            password.encode("utf-8"),
            stored_hash.encode("utf-8")
        )
    except ValueError:
        return False


def serialize_user_account(user):
    return {
        "id": user.id,
        "fullname": user.fullname,
        "username": user.username,
        "email": user.email,
        "phone": user.phone,
        "role": user.role.role_name if user.role else "-",
        "is_active": bool(user.is_active),
        "created_at": user.created_at.isoformat() if user.created_at else None,
    }


def hashed_password(password):
    return bcrypt.hashpw(
        password.encode("utf-8"),
        bcrypt.gensalt()
    ).decode("utf-8")


@auth_bp.route("/api/test")
def test():

    return jsonify({
        "success": True,
        "message": "Authentication Route Working"
    })

# ==========================
# REGISTER OWNER PAGE
# ==========================

@auth_bp.route(
    "/register-owner"
)
def register_owner_page():


    return render_template(
        "register.html"
    )


# ==========================
# FORGOT PASSWORD PAGE
# ==========================

@auth_bp.route(
    "/forgot-password"
)
def forgot_password_page():


    return render_template(
        "forgot_password.html"
    )

 
# ==========================
# REGISTER OWNER
# ==========================

@auth_bp.route(
    "/api/register-owner",
    methods=["POST"]
)
def register_owner():


    fullname = request.form.get("fullname")

    username = request.form.get("username")

    password = request.form.get("password")

    email = request.form.get("email")

    phone = request.form.get("phone")


    # ==========================
    # CEK INPUT
    # ==========================

    if not all([fullname, username, password, email]):
        return api_error("Data wajib diisi", 400)

    owner_role = Role.query.filter_by(role_name="OWNER").first()
    if not owner_role:
        return api_error("Role OWNER belum tersedia", 500)



    # ==========================
    # CEK OWNER SUDAH ADA
    # ==========================


    owner_exist = User.query.filter_by(
        role_id=owner_role.id
    ).first()


    if owner_exist:


        return api_error("Owner sudah dibuat", 409)



    # ==========================
    # CEK USERNAME
    # ==========================


    user = User.query.filter_by(
        username=username
    ).first()


    if user:


        return api_error("Username sudah ada", 409)



    # ==========================
    # CEK EMAIL
    # ==========================


    email_exist = User.query.filter_by(
        email=email
    ).first()


    if email_exist:


        return api_error("Email sudah digunakan", 409)



    # ==========================
    # PASSWORD HASH
    # ==========================


    hashed = bcrypt.hashpw(

        password.encode("utf-8"),

        bcrypt.gensalt()

    ).decode("utf-8")



    owner = User(

        role_id=owner_role.id,

        fullname=fullname,

        username=username,

        password=hashed,

        email=email,

        phone=phone

    )



    try:
        db.session.add(owner)
        db.session.commit()
    except Exception:
        db.session.rollback()
        return api_error("Owner gagal dibuat", 500)

    return api_success("Owner berhasil dibuat")

# ==========================
# LOGIN
# ==========================

@auth_bp.route(
    "/api/login",
    methods=["POST"]
)
def login():


    data = request.get_json(silent=True) or {}


    username = data.get(
        "username"
    )


    password = data.get(
        "password"
    )

    login_scope = (data.get("login_scope") or "").strip().lower()


    if not username or not password:
        return api_error("Username dan password wajib diisi", 400)

    user = User.query.filter_by(
        username=username
    ).first()



    # USER TIDAK ADA

    if not user:


        return api_error("Username tidak ditemukan", 401)




    # AKUN NONAKTIF

    if not user.is_active:


        return api_error("Akun tidak aktif", 403)




    # CEK PASSWORD BCRYPT

    is_valid = verify_password(password, user.password)

    if not is_valid:
        return api_error("Password salah", 401)

    role_name = (user.role.role_name if user.role else "").upper()

    # Halaman login owner dan staff memakai endpoint yang sama, tetapi akun
    # hanya boleh masuk melalui halaman yang sesuai dengan perannya.
    if login_scope == "owner" and role_name != "OWNER":
        return api_error("Akun ini adalah akun staff. Silakan login melalui halaman Staff.", 403)

    if login_scope == "staff" and role_name == "OWNER":
        return api_error("Akun Owner hanya dapat login melalui halaman Owner.", 403)




    # SIMPAN SESSION

    session["user_id"] = user.id


    session["role_id"] = user.role_id
    session["login_scope"] = "owner" if role_name == "OWNER" else "staff"




    return jsonify({
        "success": True,
        "message": "Login berhasil",
        "user": {
            "id": user.id,
            "fullname": user.fullname,
            "username": user.username,
            "role": user.role.role_name,
            "redirect_url": login_destination(role_name)
        },
    })

# ==========================
# GET USER LOGIN
# ==========================

@auth_bp.route("/api/me")
def me():


    if "user_id" not in session:


        return jsonify({

            "success": False,

            "message": "Belum login"

        }),401



    user = User.query.get(
        session["user_id"]
    )

    if not user:
        session.clear()
        return api_error("Session tidak valid", 401)


    return jsonify({


        "success": True,


        "user": {


            "id":
            user.id,


            "fullname":
            user.fullname,


            "username":
            user.username,


            "email":
            user.email,


            "phone":
            user.phone,

            "role_id":
            user.role_id,


            "role":
            user.role.role_name


        }


    })


# ==========================
# OWNER MANAGED ACCOUNTS
# ==========================

@auth_bp.route("/api/accounts", methods=["GET"])
@role_name_required("OWNER")
def list_accounts():
    role_filter = (request.args.get("role") or "").strip().upper()

    query = User.query.join(Role).filter(Role.role_name.in_(MANAGED_ACCOUNT_ROLES))
    if role_filter in MANAGED_ACCOUNT_ROLES:
        query = query.filter(Role.role_name == role_filter)

    users = query.order_by(Role.role_name.asc(), User.fullname.asc()).all()
    return jsonify({
        "success": True,
        "data": [serialize_user_account(user) for user in users]
    })


@auth_bp.route("/api/accounts", methods=["POST"])
@role_name_required("OWNER")
def create_account():
    data = request.get_json(silent=True) or {}
    fullname = (data.get("fullname") or "").strip()
    username = (data.get("username") or "").strip()
    email = (data.get("email") or "").strip() or None
    phone = (data.get("phone") or "").strip() or None
    password = data.get("password") or ""
    role_name = (data.get("role") or "").strip().upper()

    if not fullname or not username or not password or role_name not in MANAGED_ACCOUNT_ROLES:
        return api_error("Nama, username, password, dan role wajib diisi", 400)
    if len(password) < 6:
        return api_error("Password minimal 6 karakter", 400)
    if User.query.filter_by(username=username).first():
        return api_error("Username sudah digunakan", 409)
    if email and User.query.filter_by(email=email).first():
        return api_error("Email sudah digunakan", 409)

    role = Role.query.filter_by(role_name=role_name).first()
    if not role:
        return api_error(f"Role {role_name} belum tersedia", 500)

    user = User(
        role_id=role.id,
        fullname=fullname,
        username=username,
        password=hashed_password(password),
        email=email,
        phone=phone,
        is_active=True,
    )

    try:
        db.session.add(user)
        db.session.flush()
        ensure_staff_profile_for_user(user)
        db.session.commit()
        return api_success("Akun berhasil dibuat", serialize_user_account(user), 201)
    except Exception:
        db.session.rollback()
        return api_error("Akun gagal dibuat", 500)


@auth_bp.route("/api/accounts/<int:user_id>", methods=["PUT"])
@role_name_required("OWNER")
def update_account(user_id):
    user = User.query.get(user_id)
    if not user or not user.role or user.role.role_name not in MANAGED_ACCOUNT_ROLES:
        return api_error("Akun tidak ditemukan", 404)

    data = request.get_json(silent=True) or {}
    fullname = (data.get("fullname") or "").strip()
    username = (data.get("username") or "").strip()
    email = (data.get("email") or "").strip() or None
    phone = (data.get("phone") or "").strip() or None
    role_name = (data.get("role") or user.role.role_name).strip().upper()
    password = data.get("password") or ""
    is_active = data.get("is_active")

    if not fullname or not username or role_name not in MANAGED_ACCOUNT_ROLES:
        return api_error("Nama, username, dan role wajib diisi", 400)
    if password and len(password) < 6:
        return api_error("Password minimal 6 karakter", 400)

    username_exists = User.query.filter(
        User.username == username,
        User.id != user.id
    ).first()
    if username_exists:
        return api_error("Username sudah digunakan", 409)

    if email:
        email_exists = User.query.filter(
            User.email == email,
            User.id != user.id
        ).first()
        if email_exists:
            return api_error("Email sudah digunakan", 409)

    role = Role.query.filter_by(role_name=role_name).first()
    if not role:
        return api_error(f"Role {role_name} belum tersedia", 500)

    user.fullname = fullname
    user.username = username
    user.email = email
    user.phone = phone
    user.role_id = role.id
    if password:
        user.password = hashed_password(password)
    if is_active is not None:
        user.is_active = bool(is_active)

    try:
        ensure_staff_profile_for_user(user)
        db.session.commit()
        return api_success("Akun berhasil diperbarui", serialize_user_account(user))
    except Exception:
        db.session.rollback()
        return api_error("Akun gagal diperbarui", 500)


@auth_bp.route("/api/accounts/<int:user_id>/toggle", methods=["PATCH"])
@role_name_required("OWNER")
def toggle_account(user_id):
    user = User.query.get(user_id)
    if not user or not user.role or user.role.role_name not in MANAGED_ACCOUNT_ROLES:
        return api_error("Akun tidak ditemukan", 404)

    data = request.get_json(silent=True) or {}
    if "is_active" in data:
        user.is_active = bool(data.get("is_active"))
    else:
        user.is_active = not bool(user.is_active)

    try:
        ensure_staff_profile_for_user(user)
        db.session.commit()
        status_text = "diaktifkan" if user.is_active else "dinonaktifkan"
        return api_success(f"Akun berhasil {status_text}", serialize_user_account(user))
    except Exception:
        db.session.rollback()
        return api_error("Status akun gagal diperbarui", 500)

# ==========================
# UPDATE PROFILE
# ==========================

@auth_bp.route(
    "/api/update-profile",
    methods=["POST"]
)
def update_profile():


    if "user_id" not in session:


        return jsonify({

            "success":False,

            "message":"Belum login"

        }),401



    user = User.query.get(
        session["user_id"]
    )

    if not user:
        session.clear()
        return api_error("Session tidak valid", 401)


    fullname = request.form.get(
        "fullname"
    )


    username = request.form.get(
        "username"
    )


    email = request.form.get(
        "email"
    )


    phone = request.form.get(
        "phone"
    )


    if not fullname or not username:
        return api_error("Nama lengkap dan username wajib diisi", 400)

    username_exists = User.query.filter(
        User.username == username,
        User.id != user.id
    ).first()
    if username_exists:
        return api_error("Username sudah digunakan", 409)

    if email:
        email_exists = User.query.filter(
            User.email == email,
            User.id != user.id
        ).first()
        if email_exists:
            return api_error("Email sudah digunakan", 409)

    # update data

    user.fullname = fullname

    user.username = username

    user.email = email

    user.phone = phone


    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        return api_error("Profil gagal diperbarui", 500)



    return jsonify({


        "success":True,


        "message":
        "Profile berhasil diperbarui",


        "user":{


            "id":
            user.id,


            "fullname":
            user.fullname,


            "username":
            user.username,


            "email":
            user.email,


            "phone":
            user.phone,

            "role_id":
            user.role_id


        }


    })

# ==========================
# CHANGE PASSWORD
# ==========================

@auth_bp.route(
    "/api/change-password",
    methods=["POST"]
)
def change_password():


    if "user_id" not in session:


        return jsonify({

            "success":False,

            "message":"Belum login"

        }),401



    data = request.get_json(silent=True) or {}


    old_password = data.get(
        "old_password"
    )


    new_password = data.get(
        "new_password"
    )



    user = User.query.get(
        session["user_id"]
    )



    if not old_password or not new_password:
        return api_error("Password lama dan baru wajib diisi", 400)

    # cek password lama

    if not verify_password(old_password, user.password):


        return api_error("Password lama salah", 400)



    # hash password baru

    hashed = bcrypt.hashpw(

        new_password.encode("utf-8"),

        bcrypt.gensalt()

    ).decode("utf-8")



    user.password = hashed


    db.session.commit()



    return jsonify({

        "success":True,

        "message":"Password berhasil diperbarui"

    })

# ==========================
# FORGOT PASSWORD
# ==========================

@auth_bp.route(
    "/api/forgot-password",
    methods=["POST"]
)
def forgot_password():


    data = request.get_json(silent=True) or {}


    email = (
        data.get(
            "email"
        )
        or ""
    ).strip().lower()

    if not email:
        return api_error(
            "Email wajib diisi.",
            400
        )

    if not EMAIL_PATTERN.match(email):
        return api_error(
            "Format email tidak valid.",
            400
        )


    user = User.query.filter_by(
        email=email
    ).first()



    if not user:
        return api_success(
            FORGOT_PASSWORD_SUCCESS_MESSAGE
        )



    now = datetime.now()

    if user.reset_token and user.reset_expired and user.reset_expired > now:
        token = user.reset_token
    else:
        token = secrets.token_urlsafe(
            32
        )



        user.reset_token = token


    user.reset_expired = (

        now

        +

        timedelta(minutes=15)

    )



    db.session.commit()



    try:
        send_reset_email(
            user.email,
            token
        )
    except Exception as error:
        print("RESEND ERROR:", repr(error))
        current_app.logger.exception(
            "Gagal mengirim email reset password"
        )
        return api_error(
            FORGOT_PASSWORD_ERROR_MESSAGE,
            500
        )



    return jsonify({

        "success":True,

        "message":
        FORGOT_PASSWORD_SUCCESS_MESSAGE

    })

    # ==========================
# SAVE RESET PASSWORD
# ==========================

@auth_bp.route(
    "/api/reset-password",
    methods=["POST"]
)
def reset_password():


    data = request.get_json(silent=True) or {}


    token = data.get(
        "token"
    )


    password = data.get(
        "password"
    )



    user = User.query.filter_by(
        reset_token=token
    ).first()



    if not user:


        return jsonify({

            "success":False,

            "message":
            "Token tidak valid"

        }),400

    if user.reset_expired and user.reset_expired < datetime.now():

        user.reset_token = None


        user.reset_expired = None


        db.session.commit()


        return jsonify({

            "success":False,

            "message":
            "Token sudah expired"

        }),400


    if not password:


        return jsonify({

            "success":False,

            "message":
            "Password wajib diisi"

        }),400




    hashed = bcrypt.hashpw(

        password.encode("utf-8"),

        bcrypt.gensalt()

    ).decode("utf-8")




    user.password = hashed


    user.reset_token = None


    user.reset_expired = None




    db.session.commit()




    return jsonify({


        "success":True,


        "message":
        "Password berhasil diperbarui"


    })

# ==========================
# LOGOUT
# ==========================

@auth_bp.route("/api/logout", methods=["GET", "POST"])
def logout():

    redirect_url = (
        "/staff/login"
        if session.get("login_scope") == "staff"
        else "/"
    )

    session.clear()

    if request.method == "GET":

        return redirect(redirect_url)

    return jsonify({
        "success": True,
        "message": "Logout berhasil",
        "redirect_url": redirect_url
    })

# ==========================
# LOGOUT PAGE
# ==========================

@auth_bp.route("/logout")
def logout_page():

    redirect_url = (
        "/staff/login"
        if session.get("login_scope") == "staff"
        else "/"
    )

    session.clear()

    return redirect(redirect_url)

# ==========================
# RESET PASSWORD PAGE
# ==========================

@auth_bp.route(
    "/reset-password/<token>"
)
def reset_password_page(token):


    user = User.query.filter_by(
        reset_token=token
    ).first()


    if not user:


        return "Token tidak valid"



    if user.reset_expired and user.reset_expired < datetime.now():


        return "Token sudah expired"



    return render_template(

        "reset_password.html",

        token=token

    )
