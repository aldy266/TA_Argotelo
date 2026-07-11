from pathlib import Path
from datetime import time

from flask import Flask, jsonify, render_template, request, session
from flask_cors import CORS
from sqlalchemy import text

from config import Config
from model import Role, Shift, User, db

from routes.auth import auth_bp
from routes.owner import owner_bp
from routes.cashier import cashier_bp
from routes.finance import finance_bp
from routes.inventory import inventory_bp
from routes.purchase_order import purchase_order_bp
from routes.staff import staff_bp
from routes.attendance import attendance_bp


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


@app.context_processor
def inject_current_user_role():
    user_id = session.get("user_id")
    if not user_id:
        return {
            "current_user_role": None
        }

    user = User.query.get(user_id)
    return {
        "current_user_role": user.role.role_name.upper() if user and user.role else None
    }


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


def remove_legacy_staff_schedule_unique_constraint():
    dialect = db.engine.dialect.name

    try:
        if dialect in {"mysql", "mariadb"}:
            exists = db.session.execute(text("""
                SELECT COUNT(1)
                FROM INFORMATION_SCHEMA.STATISTICS
                WHERE TABLE_SCHEMA = DATABASE()
                  AND TABLE_NAME = 'staff_schedules'
                  AND INDEX_NAME = 'uq_staff_schedule_date'
            """)).scalar()

            if exists:
                replacement_exists = db.session.execute(text("""
                    SELECT COUNT(1)
                    FROM INFORMATION_SCHEMA.STATISTICS
                    WHERE TABLE_SCHEMA = DATABASE()
                      AND TABLE_NAME = 'staff_schedules'
                      AND INDEX_NAME = 'idx_schedule_staff_date'
                """)).scalar()

                if not replacement_exists:
                    db.session.execute(text(
                        "CREATE INDEX idx_schedule_staff_date ON staff_schedules (staff_id, schedule_date)"
                    ))

                db.session.execute(text(
                    "ALTER TABLE staff_schedules DROP INDEX uq_staff_schedule_date"
                ))
                db.session.commit()
            return

        if dialect == "sqlite":
            index_rows = db.session.execute(text(
                "PRAGMA index_list('staff_schedules')"
            )).fetchall()
            has_legacy_unique = False

            for row in index_rows:
                index_name = row[1]
                is_unique = bool(row[2])
                if not is_unique:
                    continue

                columns = [
                    info_row[2]
                    for info_row in db.session.execute(text(
                        f"PRAGMA index_info('{index_name}')"
                    )).fetchall()
                ]
                if columns == ["staff_id", "schedule_date"]:
                    has_legacy_unique = True
                    break

            if not has_legacy_unique:
                return

            db.session.rollback()
            with db.engine.begin() as connection:
                connection.execute(text("PRAGMA foreign_keys=OFF"))
                connection.execute(text("""
                    CREATE TABLE staff_schedules_new (
                        id INTEGER NOT NULL PRIMARY KEY,
                        staff_id INTEGER NOT NULL,
                        shift_id INTEGER NOT NULL,
                        schedule_date DATE NOT NULL,
                        created_at DATETIME,
                        updated_at DATETIME,
                        FOREIGN KEY(staff_id) REFERENCES staff (id) ON DELETE CASCADE,
                        FOREIGN KEY(shift_id) REFERENCES shifts (id) ON DELETE CASCADE
                    )
                """))
                connection.execute(text("""
                    INSERT INTO staff_schedules_new (
                        id, staff_id, shift_id, schedule_date, created_at, updated_at
                    )
                    SELECT id, staff_id, shift_id, schedule_date, created_at, updated_at
                    FROM staff_schedules
                """))
                connection.execute(text("DROP TABLE staff_schedules"))
                connection.execute(text(
                    "ALTER TABLE staff_schedules_new RENAME TO staff_schedules"
                ))
                connection.execute(text(
                    "CREATE INDEX IF NOT EXISTS idx_schedule_date ON staff_schedules (schedule_date)"
                ))
                connection.execute(text(
                    "CREATE INDEX IF NOT EXISTS idx_schedule_staff_date ON staff_schedules (staff_id, schedule_date)"
                ))
                connection.execute(text("PRAGMA foreign_keys=ON"))
    except Exception as error:
        db.session.rollback()
        print(f"Skip staff schedule constraint migration: {error}")


def ensure_transaction_cash_columns():
    dialect = db.engine.dialect.name
    required_columns = {
        "cash_received": "DECIMAL(12, 2) NULL",
        "cash_change": "DECIMAL(12, 2) NULL",
    }

    try:
        if dialect in {"mysql", "mariadb"}:
            existing = {
                row[0]
                for row in db.session.execute(text("""
                    SELECT COLUMN_NAME
                    FROM INFORMATION_SCHEMA.COLUMNS
                    WHERE TABLE_SCHEMA = DATABASE()
                      AND TABLE_NAME = 'transactions'
                      AND COLUMN_NAME IN ('cash_received', 'cash_change')
                """)).fetchall()
            }

            for column, definition in required_columns.items():
                if column not in existing:
                    db.session.execute(text(
                        f"ALTER TABLE transactions ADD COLUMN {column} {definition}"
                    ))
            db.session.commit()
            return

        if dialect == "sqlite":
            existing = {
                row[1]
                for row in db.session.execute(text(
                    "PRAGMA table_info('transactions')"
                )).fetchall()
            }

            for column in required_columns:
                if column not in existing:
                    db.session.execute(text(
                        f"ALTER TABLE transactions ADD COLUMN {column} NUMERIC(12, 2)"
                    ))
            db.session.commit()
            return
    except Exception as error:
        db.session.rollback()
        print(f"Skip transaction cash column migration: {error}")


def initialize_database():
    db.create_all()
    remove_legacy_staff_schedule_unique_constraint()
    ensure_transaction_cash_columns()
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
app.register_blueprint(attendance_bp)


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
