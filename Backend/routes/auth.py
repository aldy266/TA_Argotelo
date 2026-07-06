from flask import (
    Blueprint,
    redirect,
    request,
    jsonify,
    session,
    render_template
)

from model import Role, db, User

import bcrypt

import cloudinary.uploader

import secrets

from datetime import datetime, timedelta

from utils.email_service import send_reset_email

from datetime import datetime

from cloudinary_config import *

ALLOWED_IMAGE_EXTENSIONS = {"jpg", "jpeg", "png", "webp"}

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


def is_allowed_image(file_storage):
    if not file_storage or not file_storage.filename:
        return False

    extension = file_storage.filename.rsplit(".", 1)[-1].lower()
    return extension in ALLOWED_IMAGE_EXTENSIONS


def upload_profile_photo(file_storage):
    if not file_storage:
        return None

    if not is_allowed_image(file_storage):
        raise ValueError("Format foto harus JPG, JPEG, PNG, atau WEBP")

    upload = cloudinary.uploader.upload(
        file_storage,
        folder="argotelo/profile"
    )

    secure_url = upload.get("secure_url")
    if not secure_url:
        raise ValueError("Upload foto gagal")

    return secure_url


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


    photo_file = request.files.get(
        "photo"
    )


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
    # UPLOAD FOTO
    # ==========================


    photo_url = None


    if photo_file:
        try:
            photo_url = upload_profile_photo(photo_file)
        except ValueError as error:
            return api_error(str(error), 400)



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

        phone=phone,

        photo=photo_url

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

    if not verify_password(password, user.password):


        return api_error("Password salah", 401)




    # SIMPAN SESSION

    session["user_id"] = user.id


    session["role_id"] = user.role_id




    return jsonify({
        "success": True,
        "message": "Login berhasil",
        "user": {
            "id": user.id,
            "fullname": user.fullname,
            "username": user.username,
            "photo": user.photo,
            "role": user.role.role_name
        }
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


            "photo":
            user.photo,


            "role_id":
            user.role_id,


            "role":
            user.role.role_name


        }


    })

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


    photo_file = request.files.get(
        "photo"
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



    # jika ganti foto

    if photo_file:
        try:
            user.photo = upload_profile_photo(photo_file)
        except ValueError as error:
            return api_error(str(error), 400)

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


            "photo":
            user.photo,


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


    email = data.get(
        "email"
    )


    user = User.query.filter_by(
        email=email
    ).first()



    if not user:


        return jsonify({

            "success":False,

            "message":
            "Email tidak ditemukan"

        }),404



    # hanya owner boleh reset sendiri

    if user.role.role_name != "OWNER":


        return api_error("Silakan hubungi Owner untuk reset password", 403)




    token = secrets.token_urlsafe(
        32
    )



    user.reset_token = token


    user.reset_expired = (

        datetime.now()

        +

        timedelta(minutes=15)

    )



    db.session.commit()



    send_reset_email(

        user.email,

        token

    )



    return jsonify({

        "success":True,

        "message":
        "Link reset password sudah dikirim ke email"

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

    session.clear()

    if request.method == "GET":

        return redirect("/")

    return jsonify({
        "success": True,
        "message": "Logout berhasil"
    })

# ==========================
# LOGOUT PAGE
# ==========================

@auth_bp.route("/logout")
def logout_page():

    session.clear()

    return redirect("/")

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
