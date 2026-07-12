from functools import wraps
from flask import jsonify, request, session, redirect, abort

from model import User
from utils.roles import expand_role_names


# ==========================
# LOGIN REQUIRED
# ==========================

def login_required(f):

    @wraps(f)
    def decorated_function(*args, **kwargs):

        if "user_id" not in session:
            if request.path.startswith("/api/"):
                return jsonify({
                    "success": False,
                    "message": "Belum login"
                }), 401

            return redirect("/")

        return f(*args, **kwargs)

    return decorated_function


# ==========================
# ROLE REQUIRED
# ==========================

def role_required(role_id):

    def decorator(f):

        @wraps(f)
        def decorated_function(*args, **kwargs):

            if session.get("role_id") != role_id:
                return abort(403)

            return f(*args, **kwargs)

        return decorated_function

    return decorator


def role_name_required(*role_names):
    normalized_roles = expand_role_names(role_names)

    def decorator(f):

        @wraps(f)
        def decorated_function(*args, **kwargs):

            if "user_id" not in session:
                if request.path.startswith("/api/"):
                    return jsonify({
                        "success": False,
                        "message": "Belum login"
                    }), 401

                return redirect("/")

            user = User.query.get(session["user_id"])
            if not user or not user.role:
                session.clear()
                return abort(403)

            if user.role.role_name.upper() not in normalized_roles:
                return abort(403)

            return f(*args, **kwargs)

        return decorated_function

    return decorator
