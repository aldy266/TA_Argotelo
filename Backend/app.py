from pathlib import Path
from datetime import time

from flask import Flask, jsonify, render_template, request
from flask_cors import CORS
from sqlalchemy import text

from config import Config
from model import Role, Shift, db

from routes.auth import auth_bp
from routes.owner import owner_bp
from routes.cashier import cashier_bp
from routes.finance import finance_bp
from routes.inventory import inventory_bp
from routes.purchase_order import purchase_order_bp
from routes.staff import staff_bp


BASE_DIR = Path(__file__).resolve().parent

app = Flask(
    __name__,
    template_folder=str(BASE_DIR / "templates"),
    static_folder=str(BASE_DIR / "static")
)


# ==========================
# CONFIG
# ==========================

app.config.from_object(Config)

app.secret_key = Config.SECRET_KEY


app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
app.config["SESSION_COOKIE_HTTPONLY"] = True


CORS(
    app,
    supports_credentials=True
)


db.init_app(app)


def seed_default_roles():
    default_roles = [
        ("OWNER", "Pemilik Sistem"),
        ("FINANCE", "Bagian Keuangan"),
        ("KASIR", "Kasir / Tim Toko"),
        ("HRD", "Human Resource"),
    ]

    for role_name, description in default_roles:
        role = Role.query.filter_by(role_name=role_name).first()
        if not role:
            db.session.add(Role(role_name=role_name, description=description))

    db.session.commit()


def seed_default_shifts():
    default_shifts = [
        ("Morning Shift", time(7, 0), time(15, 0), 10),
        ("Evening Shift", time(15, 0), time(23, 0), 10),
    ]

    for shift_name, start_time, end_time, tolerance_minutes in default_shifts:
        shift = Shift.query.filter_by(shift_name=shift_name).first()
        if not shift:
            db.session.add(Shift(
                shift_name=shift_name,
                start_time=start_time,
                end_time=end_time,
                tolerance_minutes=tolerance_minutes,
                status="ACTIVE"
            ))

    db.session.commit()


def initialize_database():
    db.create_all()
    seed_default_roles()
    seed_default_shifts()



# ==========================
# BLUEPRINT
# ==========================


app.register_blueprint(auth_bp)
app.register_blueprint(owner_bp)
app.register_blueprint(cashier_bp)
app.register_blueprint(finance_bp)
app.register_blueprint(inventory_bp)
app.register_blueprint(purchase_order_bp)
app.register_blueprint(staff_bp)



# ==========================
# PAGE
# ==========================


@app.route("/")
def login_page():

    return render_template(
        "login.html"
    )


@app.route("/register")
def register_page():

    return render_template(
        "register.html"
    )


@app.route("/api/health")
def health_check():
    try:
        db.session.execute(text("SELECT 1"))
        return jsonify({
            "success": True,
            "database": "connected"
        })
    except Exception:
        db.session.rollback()
        return jsonify({
            "success": False,
            "database": "disconnected",
            "message": "Database belum dapat dihubungi"
        }), 500


@app.errorhandler(403)
def forbidden(error):
    if request.path.startswith("/api/"):
        return jsonify({
            "success": False,
            "message": "Akses ditolak"
        }), 403

    return render_template("login.html"), 403


@app.errorhandler(404)
def not_found(error):
    if request.path.startswith("/api/"):
        return jsonify({
            "success": False,
            "message": "Route tidak ditemukan"
        }), 404

    return render_template("login.html"), 404


@app.errorhandler(500)
def internal_error(error):
    db.session.rollback()
    if request.path.startswith("/api/"):
        return jsonify({
            "success": False,
            "message": "Terjadi kesalahan server"
        }), 500

    return render_template("login.html"), 500



# ==========================
# RUN
# ==========================


if __name__ == "__main__":

    with app.app_context():
        initialize_database()


    app.run(

        debug=True,

        host="0.0.0.0",

        port=5000

    )
