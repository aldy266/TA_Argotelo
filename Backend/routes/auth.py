from flask import (
    Blueprint,
    redirect,
    request,
    jsonify,
    session,
    render_template
)

from model import db, User

import bcrypt

import cloudinary.uploader

import secrets

from datetime import datetime, timedelta

from utils.email_service import send_reset_email

from datetime import datetime

from cloudinary_config import *

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

    if not all([
        fullname,
        username,
        password,
        email
    ]):


        return jsonify({

            "success":False,

            "message":"Data wajib diisi"

        }),400



    # ==========================
    # CEK OWNER SUDAH ADA
    # ==========================


    owner_exist = User.query.filter_by(
        role_id=1
    ).first()


    if owner_exist:


        return jsonify({

            "success":False,

            "message":"Owner sudah dibuat"

        }),400



    # ==========================
    # CEK USERNAME
    # ==========================


    user = User.query.filter_by(
        username=username
    ).first()


    if user:


        return jsonify({

            "success":False,

            "message":"Username sudah ada"

        }),400



    # ==========================
    # CEK EMAIL
    # ==========================


    email_exist = User.query.filter_by(
        email=email
    ).first()


    if email_exist:


        return jsonify({

            "success":False,

            "message":"Email sudah digunakan"

        }),400



    # ==========================
    # UPLOAD FOTO
    # ==========================


    photo_url = None


    if photo_file:


        upload = cloudinary.uploader.upload(

            photo_file,

            folder="argotelo/profile"

        )


        photo_url = upload[
            "secure_url"
        ]



    # ==========================
    # PASSWORD HASH
    # ==========================


    hashed = bcrypt.hashpw(

        password.encode("utf-8"),

        bcrypt.gensalt()

    ).decode("utf-8")



    owner = User(

        role_id=1,

        fullname=fullname,

        username=username,

        password=hashed,

        email=email,

        phone=phone,

        photo=photo_url

    )



    db.session.add(
        owner
    )


    db.session.commit()



    return jsonify({

        "success":True,

        "message":"Owner berhasil dibuat"

    })

# ==========================
# LOGIN
# ==========================

@auth_bp.route(
    "/api/login",
    methods=["POST"]
)
def login():


    data = request.get_json()


    username = data.get(
        "username"
    )


    password = data.get(
        "password"
    )


    user = User.query.filter_by(
        username=username
    ).first()



    # USER TIDAK ADA

    if not user:


        return jsonify({

            "success": False,

            "message":
            "Username tidak ditemukan"

        }),401




    # AKUN NONAKTIF

    if not user.is_active:


        return jsonify({

            "success":False,

            "message":
            "Akun tidak aktif"

        }),403




    # CEK PASSWORD BCRYPT

    if not bcrypt.checkpw(

        password.encode("utf-8"),

        user.password.encode("utf-8")

    ):


        return jsonify({

            "success":False,

            "message":
            "Password salah"

        }),401




    # SIMPAN SESSION

    session["user_id"] = user.id


    session["role_id"] = user.role_id




    return jsonify({


        "success": True,


        "message":
        "Login berhasil",



        "user":{


            "id":
            user.id,


            "fullname":
            user.fullname,


            "username":
            user.username,


            "photo":
            user.photo,


            "role":
            user.role.role_name


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



    # update data

    user.fullname = fullname

    user.username = username

    user.email = email

    user.phone = phone



    # jika ganti foto

    if photo_file:


        upload = cloudinary.uploader.upload(

            photo_file,

            folder="argotelo/profile"

        )


        user.photo = upload[
            "secure_url"
        ]



    db.session.commit()



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



    data = request.get_json()


    old_password = data.get(
        "old_password"
    )


    new_password = data.get(
        "new_password"
    )



    user = User.query.get(
        session["user_id"]
    )



    # cek password lama

    if not bcrypt.checkpw(

        old_password.encode("utf-8"),

        user.password.encode("utf-8")

    ):


        return jsonify({

            "success":False,

            "message":"Password lama salah"

        }),400



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


    data = request.get_json()


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

    if user.role_id != 1:


        return jsonify({

            "success":False,

            "message":
            "Silakan hubungi Owner untuk reset password"

        }),403




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


    data = request.get_json()


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

@auth_bp.route("/api/logout", methods=["POST"])
def logout():

    session.clear()

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



    if user.reset_expired < datetime.now():


        return "Token sudah expired"



    return render_template(

        "reset_password.html",

        token=token

    )