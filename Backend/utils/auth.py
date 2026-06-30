from functools import wraps
from flask import session, redirect, abort


# ==========================
# LOGIN REQUIRED
# ==========================

def login_required(f):

    @wraps(f)
    def decorated_function(*args, **kwargs):

        if "user_id" not in session:
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