from datetime import datetime, time, timedelta
from decimal import Decimal, InvalidOperation
import io
import json
import os
from tabnanny import check

import cloudinary.uploader
from flask import Blueprint, current_app, jsonify, redirect, render_template, request, send_file, session, url_for
from openpyxl import Workbook
from sqlalchemy import func, or_
from sqlalchemy import text
from werkzeug.security import generate_password_hash
import bcrypt

from model import (
    Attendance,
    Inventory,
    MenuItem,
    MenuRecipe,
    Staff,
    StaffSchedule,
    StockMovement,
    Transaction,
    TransactionItem,
    User,
    db,
    waktu_wib,
)
from utils.auth import role_name_required
from utils.roles import STORE_ROLE_CODES, role_form_code, role_group, role_label


owner_bp = Blueprint("owner", __name__)

ALLOWED_IMAGE_EXTENSIONS = {"jpg", "jpeg", "png", "webp"}


def api_success(data=None, message="Berhasil", status=200):
    payload = {
        "success": True,
        "message": message,
    }
    if data is not None:
        payload["data"] = data
    return jsonify(payload), status


def api_error(message, status=400):
    return jsonify({
        "success": False,
        "message": message,
    }), status


def parse_date(value):
    if not value:
        return None
    return datetime.fromisoformat(value).date()


def period_range(filter_name, start_date=None, end_date=None):
    today = waktu_wib().date()

    if filter_name == "week":
        start = today - timedelta(days=today.weekday())
        end = today
    elif filter_name == "month":
        start = today.replace(day=1)
        end = today
    elif filter_name == "custom":
        start = parse_date(start_date)
        end = parse_date(end_date)
        if not start or not end:
            raise ValueError("Tanggal awal dan akhir wajib diisi")
        if start > end:
            raise ValueError("Tanggal awal tidak boleh melewati tanggal akhir")
    else:
        start = today
        end = today

    return (
        datetime.combine(start, time.min),
        datetime.combine(end, time.max),
        start,
        end,
    )


def rupiah_value(value):
    return float(value or 0)


def serialize_recipe_item(recipe):
    inventory = recipe.inventory
    return {
        "id": recipe.id,
        "id_inventory": recipe.id_inventory,
        "nama_bahan": inventory.nama_bahan if inventory else "-",
        "satuan": inventory.satuan if inventory else "",
        "stock": rupiah_value(inventory.stok) if inventory else 0,
        "quantity": rupiah_value(recipe.quantity),
    }


def serialize_menu_item(item, include_recipe=False):
    data = {
        "id": item.id,
        "name": item.name,
        "category": item.category,
        "price": rupiah_value(item.price),
        "image_url": item.image_url,
        "status": item.status,
        "created_at": item.created_at.isoformat() if item.created_at else None,
        "recipe_count": len(item.recipes or []),
        "recipe_configured": bool(item.recipes),
    }

    if include_recipe:
        data["recipe"] = [
            serialize_recipe_item(recipe)
            for recipe in sorted(
                item.recipes,
                key=lambda recipe: recipe.inventory.nama_bahan.lower()
                if recipe.inventory and recipe.inventory.nama_bahan else "",
            )
        ]

    return data


def decimal_quantity(value, field_name):
    try:
        result = Decimal(str(value).replace(",", "."))
    except (InvalidOperation, TypeError):
        raise ValueError(f"{field_name} tidak valid")

    if result <= 0:
        raise ValueError(f"{field_name} harus lebih dari 0")

    return result


def decimal_money(value, field_name):
    try:
        result = Decimal(str(value or 0).replace(",", "."))
    except (InvalidOperation, TypeError):
        raise ValueError(f"{field_name} tidak valid")

    if result < 0:
        raise ValueError(f"{field_name} tidak boleh negatif")

    return result.quantize(Decimal("1"))


def format_quantity(value):
    value = Decimal(value or 0)
    normalized = value.normalize()
    if normalized == normalized.to_integral():
        return str(normalized.quantize(Decimal("1")))
    return format(normalized, "f")


def has_recipe_payload(data):
    return "recipe" in data or "recipes" in data


def parse_recipe_payload(data):
    raw_recipe = data.get("recipe") if "recipe" in data else data.get("recipes")
    if raw_recipe in (None, ""):
        return []

    if isinstance(raw_recipe, str):
        try:
            raw_recipe = json.loads(raw_recipe)
        except json.JSONDecodeError:
            raise ValueError("Format resep tidak valid")

    if not isinstance(raw_recipe, list):
        raise ValueError("Format resep tidak valid")

    recipe_items = []
    used_inventory = set()

    for index, raw_item in enumerate(raw_recipe, start=1):
        if not isinstance(raw_item, dict):
            raise ValueError(f"Resep baris {index} tidak valid")

        try:
            inventory_id = int(raw_item.get("id_inventory") or raw_item.get("inventory_id"))
        except (TypeError, ValueError):
            raise ValueError(f"Bahan resep baris {index} wajib dipilih")

        if inventory_id in used_inventory:
            raise ValueError("Bahan resep tidak boleh duplikat")

        quantity = decimal_quantity(raw_item.get("quantity"), f"Jumlah resep baris {index}")
        inventory = Inventory.query.get(inventory_id)
        if not inventory:
            raise ValueError(f"Bahan resep baris {index} tidak ditemukan")

        used_inventory.add(inventory_id)
        recipe_items.append((inventory, quantity))

    return recipe_items


def sync_menu_recipe(menu_item, recipe_items):

    # hapus resep lama dari database
    MenuRecipe.query.filter_by(
        menu_item_id=menu_item.id
    ).delete()


    db.session.flush()


    # tambah resep baru
    for inventory, quantity in recipe_items:

        db.session.add(MenuRecipe(

            menu_item_id=menu_item.id,

            id_inventory=inventory.id_inventory,

            quantity=quantity

        ))


def serialize_transaction(transaction, include_items=False):
    items = []
    if include_items:
        items = [
            {
                "id": item.id,
                "menu_item_id": item.menu_item_id,
                "name": item.menu_item.name if item.menu_item else "-",
                "quantity": item.quantity,
                "unit_price": rupiah_value(item.unit_price),
                "subtotal": rupiah_value(item.subtotal),
            }
            for item in transaction.items
        ]

    item_summary = ", ".join(
        f"{item.quantity}x {item.menu_item.name if item.menu_item else '-'}"
        for item in transaction.items
    )

    return {
        "id": transaction.id,
        "transaction_number": transaction.transaction_number,
        "date": transaction.created_at.strftime("%d-%m-%Y") if transaction.created_at else "",
        "time": transaction.created_at.strftime("%H:%M") if transaction.created_at else "",
        "customer_name": transaction.customer_name or "Umum",
        "cashier": transaction.cashier.fullname if transaction.cashier else "-",
        "subtotal": rupiah_value(transaction.subtotal),
        "tax": rupiah_value(transaction.tax),
        "total": rupiah_value(transaction.total),
        "payment_method": transaction.payment_method,
        "cash_received": rupiah_value(transaction.cash_received),
        "cash_change": rupiah_value(transaction.cash_change),
        "status": transaction.status.lower(),
        "items_summary": item_summary or "-",
        "items": items,
    }


def stock_notifications():
    items = Inventory.query.filter(
        Inventory.stok <= (Inventory.minimal_stok * 2)
    ).order_by(Inventory.stok.asc()).limit(20).all()

    result = []
    for item in items:
        status = "CRITICAL" if item.stok <= item.minimal_stok else "LOW"
        result.append({
            "id": item.id_inventory,
            "product": item.nama_bahan,
            "stock": f"{float(item.stok):g} {item.satuan}",
            "minimum_stock": f"{float(item.minimal_stok):g} {item.satuan}",
            "status": status,
            "time": "Real-time",
        })

    return result


def upload_menu_image(file_storage):
    if not file_storage or not file_storage.filename:
        return None

    extension = file_storage.filename.rsplit(".", 1)[-1].lower()
    if extension not in ALLOWED_IMAGE_EXTENSIONS:
        raise ValueError("Format gambar harus JPG, JPEG, PNG, atau WEBP")

    if not all([
        os.getenv("CLOUDINARY_CLOUD_NAME"),
        os.getenv("CLOUDINARY_API_KEY"),
        os.getenv("CLOUDINARY_API_SECRET"),
    ]):
        raise ValueError("Cloudinary belum dikonfigurasi")

    upload = cloudinary.uploader.upload(
        file_storage,
        folder="argotelo/menu"
    )

    secure_url = upload.get("secure_url")
    if not secure_url:
        raise ValueError("Upload gambar gagal")

    return secure_url


@owner_bp.route("/owner/dashboard")
@role_name_required("OWNER", "FINANCE")
def owner_dashboard():
    return render_template("owner_dashboard.html")


@owner_bp.route("/owner/inventory")
@role_name_required("OWNER", "FINANCE", "KASIR")
def owner_inventory():
    user = User.query.get(session.get("user_id"))
    if user and user.role and user.role.role_name.upper() in STORE_ROLE_CODES:
        return redirect(url_for("cashier.inventory"))
    return render_template("owner_inventory.html")


@owner_bp.route("/owner/staff")
@role_name_required("OWNER", "FINANCE", "HRD")
def owner_staff():
    return render_template("owner_staff.html")


@owner_bp.route("/owner/menu")
@role_name_required("OWNER")
def owner_menu():
    return render_template("owner_menu.html")


@owner_bp.route("/owner/transaction")
@role_name_required("OWNER", "FINANCE")
def owner_transaction():
    return render_template("owner_transaction.html")


@owner_bp.route("/api/dashboard", methods=["POST"])
@role_name_required("OWNER", "FINANCE")
def dashboard_api():
    payload = request.get_json(silent=True) or {}

    try:
        start_dt, end_dt, start_date, end_date = period_range(
            payload.get("filter", "today"),
            payload.get("start_date"),
            payload.get("end_date"),
        )
    except ValueError as error:
        return api_error(str(error), 400)

    sales_total = db.session.query(func.coalesce(func.sum(Transaction.total), 0)).filter(
        Transaction.created_at >= start_dt,
        Transaction.created_at <= end_dt,
        Transaction.status == "COMPLETED",
    ).scalar()

    transaction_count = Transaction.query.filter(
        Transaction.created_at >= start_dt,
        Transaction.created_at <= end_dt,
        Transaction.status == "COMPLETED",
    ).count()

    period_income = db.session.query(func.coalesce(func.sum(Transaction.total), 0)).filter(
        Transaction.created_at >= start_dt,
        Transaction.created_at <= end_dt,
        Transaction.status == "COMPLETED",
    ).scalar()

    total_scheduled = db.session.query(func.count(StaffSchedule.id)).join(
        Staff, StaffSchedule.staff_id == Staff.id
    ).filter(
        StaffSchedule.schedule_date >= start_date,
        StaffSchedule.schedule_date <= end_date,
        Staff.status == "ACTIVE",
    ).scalar() or 0
    present_count = db.session.query(func.count(func.distinct(Attendance.schedule_id))).join(
        StaffSchedule, Attendance.schedule_id == StaffSchedule.id
    ).join(
        Staff, StaffSchedule.staff_id == Staff.id
    ).filter(
        Attendance.attendance_date >= start_date,
        Attendance.attendance_date <= end_date,
        Staff.status == "ACTIVE",
        Attendance.status.in_(["PRESENT", "LATE", "COMPLETED"]),
    ).scalar() or 0

    today = waktu_wib().date()
    weekly_sales = []
    max_sales = Decimal("0")
    day_labels = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"]
    for offset in range(6, -1, -1):
        day = today - timedelta(days=offset)
        total = db.session.query(func.coalesce(func.sum(Transaction.total), 0)).filter(
            Transaction.created_at >= datetime.combine(day, time.min),
            Transaction.created_at <= datetime.combine(day, time.max),
            Transaction.status == "COMPLETED",
        ).scalar() or Decimal("0")
        max_sales = max(max_sales, Decimal(total))
        weekly_sales.append({
            "date": day.isoformat(),
            "label": day_labels[day.weekday()],
            "total": rupiah_value(total),
            "percentage": 0,
        })

    for item in weekly_sales:
        item["percentage"] = int((Decimal(str(item["total"])) / max_sales) * 100) if max_sales else 0

    top_rows = db.session.query(
        MenuItem.id,
        MenuItem.name,
        MenuItem.category,
        MenuItem.image_url,
        func.coalesce(func.sum(TransactionItem.quantity), 0).label("quantity"),
    ).join(
        TransactionItem,
        TransactionItem.menu_item_id == MenuItem.id,
    ).join(
        Transaction,
        Transaction.id == TransactionItem.transaction_id,
    ).filter(
        Transaction.created_at >= start_dt,
        Transaction.created_at <= end_dt,
        Transaction.status == "COMPLETED",
    ).group_by(
        MenuItem.id,
        MenuItem.name,
        MenuItem.category,
        MenuItem.image_url,
    ).order_by(
        func.sum(TransactionItem.quantity).desc()
    ).limit(5).all()

    recent_transactions = Transaction.query.filter(
        Transaction.created_at >= start_dt,
        Transaction.created_at <= end_dt,
        Transaction.status == "COMPLETED",
    ).order_by(Transaction.created_at.desc()).limit(5).all()

    return api_success({
        "statistics": {
            "sales": rupiah_value(sales_total),
            "transaction_count": transaction_count,
            "monthly_income": rupiah_value(period_income),
            "period_income": rupiah_value(period_income),
            "present_count": present_count,
            "total_scheduled": total_scheduled,
            "attendance_rate": round((present_count / total_scheduled) * 100, 1) if total_scheduled else 0,
            "period_start": start_date.isoformat(),
            "period_end": end_date.isoformat(),
        },
        "weekly_sales": weekly_sales,
        "top_products": [
            {
                "id": row.id,
                "name": row.name,
                "variant": row.category,
                "total": int(row.quantity or 0),
                "image": row.image_url,
            }
            for row in top_rows
        ],
        "recent_transactions": [
            serialize_transaction(transaction)
            for transaction in recent_transactions
        ],
        "notifications": stock_notifications(),
    })


@owner_bp.route("/api/notification")
@role_name_required("OWNER", "FINANCE", "KASIR")
def notification_api():
    return api_success(stock_notifications())


@owner_bp.route("/api/menu-items", methods=["GET"])
@role_name_required("OWNER", "KASIR", "FINANCE")
def get_menu_items():
    include_inactive = request.args.get("include_inactive") == "1"
    query = MenuItem.query
    if not include_inactive:
        query = query.filter_by(status="ACTIVE")

    items = query.order_by(MenuItem.name.asc()).all()
    return api_success([serialize_menu_item(item, include_recipe=True) for item in items])


@owner_bp.route("/api/menu-items", methods=["POST"])
@role_name_required("OWNER")
def create_menu_item():
    data = request.form if request.form else (request.get_json(silent=True) or {})

    name = (data.get("name") or "").strip()
    category = (data.get("category") or "").strip()
    price = data.get("price")
    status = (data.get("status") or "ACTIVE").strip().upper()

    if not name or not category:
        return api_error("Nama menu dan kategori wajib diisi", 400)
    if status not in {"ACTIVE", "INACTIVE"}:
        return api_error("Status menu tidak valid", 400)

    try:
        price = Decimal(str(price))
    except Exception:
        return api_error("Harga tidak valid", 400)

    if price < 0:
        return api_error("Harga tidak boleh negatif", 400)

    try:
        recipe_items = parse_recipe_payload(data) if has_recipe_payload(data) else []
    except ValueError as error:
        return api_error(str(error), 400)

    try:
        image_url = upload_menu_image(request.files.get("image_file"))
    except ValueError as error:
        return api_error(str(error), 400)

    item = MenuItem(
        name=name,
        category=category,
        price=price,
        image_url=image_url or data.get("image_url"),
        status=status,
    )

    try:
        db.session.add(item)
        sync_menu_recipe(item, recipe_items)
        db.session.commit()
        return api_success(
            serialize_menu_item(item, include_recipe=True),
            "Menu berhasil ditambahkan",
            201,
        )
    except Exception:
        db.session.rollback()
        return api_error("Menu gagal ditambahkan", 500)


@owner_bp.route("/api/menu-items/<int:item_id>", methods=["PUT"])
@role_name_required("OWNER")
def update_menu_item(item_id):
    item = MenuItem.query.get(item_id)
    if not item:
        return api_error("Menu tidak ditemukan", 404)

    data = request.form if request.form else (request.get_json(silent=True) or {})

    name = (data.get("name") or "").strip()
    category = (data.get("category") or "").strip()
    price = data.get("price")
    status = (data.get("status") or item.status).strip().upper()

    if not name or not category:
        return api_error("Nama menu dan kategori wajib diisi", 400)
    if status not in {"ACTIVE", "INACTIVE"}:
        return api_error("Status menu tidak valid", 400)

    try:
        price = Decimal(str(price))
    except Exception:
        return api_error("Harga tidak valid", 400)

    if price < 0:
        return api_error("Harga tidak boleh negatif", 400)

    recipe_was_sent = has_recipe_payload(data)
    try:
        recipe_items = parse_recipe_payload(data) if recipe_was_sent else None
    except ValueError as error:
        return api_error(str(error), 400)

    try:
        image_url = upload_menu_image(request.files.get("image_file"))
    except ValueError as error:
        return api_error(str(error), 400)

    item.name = name
    item.category = category
    item.price = price
    if image_url:
        item.image_url = image_url
    elif data.get("image_url"):
        item.image_url = data.get("image_url")
    item.status = status
    if recipe_was_sent:
        sync_menu_recipe(item, recipe_items)

    try:
        db.session.commit()
        return api_success(
            serialize_menu_item(item, include_recipe=True),
            "Menu berhasil diperbarui",
        )
    except Exception:
        db.session.rollback()
        return api_error("Menu gagal diperbarui", 500)


@owner_bp.route("/api/menu-items/<int:item_id>", methods=["DELETE"])
@role_name_required("OWNER")
def delete_menu_item(item_id):
    item = MenuItem.query.get(item_id)
    if not item:
        return api_error("Menu tidak ditemukan", 404)

    item.status = "INACTIVE"
    try:
        db.session.commit()
        return api_success(message="Menu berhasil dinonaktifkan")
    except Exception:
        db.session.rollback()
        return api_error("Menu gagal dinonaktifkan", 500)


def transaction_query_from_request():
    query = Transaction.query

    start = request.args.get("start")
    end = request.args.get("end")
    search = (request.args.get("search") or "").strip().lower()
    status = (request.args.get("status") or "").strip().upper()
    cashier = (request.args.get("cashier") or "").strip().lower()

    if start:
        query = query.filter(Transaction.created_at >= datetime.combine(parse_date(start), time.min))
    if end:
        query = query.filter(Transaction.created_at <= datetime.combine(parse_date(end), time.max))
    if status:
        if status == "COMPLETED":
            query = query.filter(Transaction.status == "COMPLETED")
        elif status in {"CANCEL", "CANCELLED"}:
            query = query.filter(Transaction.status == "CANCELLED")
    if search:
        query = query.outerjoin(User, Transaction.cashier_id == User.id).filter(
            or_(
                func.lower(Transaction.transaction_number).contains(search),
                func.lower(Transaction.customer_name).contains(search),
                func.lower(User.fullname).contains(search),
            )
        )
    if cashier:
        query = query.join(User, Transaction.cashier_id == User.id).filter(
            func.lower(User.fullname) == cashier
        )

    return query


@owner_bp.route("/api/transaction")
@role_name_required("OWNER", "FINANCE")
def get_transactions():
    try:
        transactions = transaction_query_from_request().order_by(
            Transaction.created_at.desc()
        ).all()
    except Exception:
        return api_error("Filter transaksi tidak valid", 400)

    return api_success([serialize_transaction(transaction) for transaction in transactions])


@owner_bp.route("/api/transaction/<int:transaction_id>")
@role_name_required("OWNER", "FINANCE", "KASIR")
def get_transaction_detail(transaction_id):
    transaction = Transaction.query.get(transaction_id)
    if not transaction:
        return api_error("Transaksi tidak ditemukan", 404)

    return api_success(serialize_transaction(transaction, include_items=True))


@owner_bp.route("/api/transaction/export-excel")
@role_name_required("OWNER", "FINANCE")
def export_transactions_excel():
    transactions = transaction_query_from_request().order_by(
        Transaction.created_at.desc()
    ).all()

    workbook = Workbook()
    sheet = workbook.active
    sheet.title = "Transactions"
    sheet.append([
        "Tanggal",
        "Nomor Transaksi",
        "Pelanggan",
        "Kasir",
        "Subtotal",
        "Pajak",
        "Total",
        "Pembayaran",
        "Status",
    ])

    for transaction in transactions:
        sheet.append([
            transaction.created_at.strftime("%Y-%m-%d %H:%M") if transaction.created_at else "",
            transaction.transaction_number,
            transaction.customer_name,
            transaction.cashier.fullname if transaction.cashier else "-",
            rupiah_value(transaction.subtotal),
            rupiah_value(transaction.tax),
            rupiah_value(transaction.total),
            transaction.payment_method,
            transaction.status,
        ])

    file = io.BytesIO()
    workbook.save(file)
    file.seek(0)

    return send_file(
        file,
        as_attachment=True,
        download_name="Laporan_Transaksi_Argotelo.xlsx",
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )


@owner_bp.route("/api/pos/menu")
@role_name_required("OWNER", "KASIR")
def pos_menu():
    items = MenuItem.query.filter_by(status="ACTIVE").order_by(MenuItem.name.asc()).all()
    return api_success([serialize_menu_item(item) for item in items])


def build_stock_requirements(prepared_items):
    requirements = {}

    for menu_item, quantity, _ in prepared_items:
        for recipe in menu_item.recipes:
            if not recipe.inventory:
                continue

            needed = Decimal(recipe.quantity) * Decimal(quantity)
            if needed <= 0:
                continue

            current = requirements.setdefault(
                recipe.id_inventory,
                {
                    "inventory": recipe.inventory,
                    "quantity": Decimal("0"),
                    "menus": set(),
                }
            )
            current["quantity"] += needed
            current["menus"].add(menu_item.name)

    return requirements


@owner_bp.route("/api/pos/checkout", methods=["POST"])
@role_name_required("OWNER", "KASIR")
def pos_checkout():
    payload = request.get_json(silent=True) or {}
    items = payload.get("items") or []
    payment_method = (payload.get("payment_method") or "").strip().upper()
    customer_name = (payload.get("customer_name") or "").strip()

    if not items:
        return api_error("Keranjang masih kosong", 400)
    if not customer_name:
        return api_error("Nama pelanggan wajib diisi", 400)
    if not payment_method:
        return api_error("Metode pembayaran wajib dipilih", 400)
    if payment_method in {"QRIS", "EWALLET"}:
        payment_method = "CASHLESS"
    if payment_method not in {"CASH", "CASHLESS", "DEBIT"}:
        return api_error("Metode pembayaran tidak valid", 400)

    subtotal = Decimal("0")
    prepared_items = []

    for raw_item in items:
        try:
            menu_item_id = int(raw_item.get("menu_item_id"))
            quantity = int(raw_item.get("quantity"))
        except Exception:
            return api_error("Item transaksi tidak valid", 400)

        if quantity <= 0:
            return api_error("Quantity harus lebih dari 0", 400)

        menu_item = MenuItem.query.get(menu_item_id)
        if not menu_item or menu_item.status != "ACTIVE":
            return api_error("Menu tidak aktif atau tidak ditemukan", 400)
        if not menu_item.recipes:
            return api_error(
                f"Resep untuk menu {menu_item.name} belum diatur. "
                "Lengkapi resep di Menu Management dulu.",
                400,
            )

        item_subtotal = Decimal(menu_item.price) * Decimal(quantity)
        subtotal += item_subtotal
        prepared_items.append((menu_item, quantity, item_subtotal))

    stock_requirements = build_stock_requirements(prepared_items)
    for requirement in stock_requirements.values():
        inventory = requirement["inventory"]
        required_quantity = requirement["quantity"]
        available_stock = Decimal(inventory.stok or 0)
        if available_stock < required_quantity:
            return api_error(
                "Stok "
                f"{inventory.nama_bahan} tidak cukup. "
                f"Butuh {format_quantity(required_quantity)} {inventory.satuan}, "
                f"tersedia {format_quantity(available_stock)} {inventory.satuan}.",
                400,
            )

    tax_rate = Decimal(str(current_app.config.get("POS_TAX_RATE", 0)))
    tax = (subtotal * tax_rate).quantize(Decimal("1")) if tax_rate else Decimal("0")
    total = subtotal + tax
    cash_received = None
    cash_change = None

    if payment_method == "CASH":
        try:
            cash_received = decimal_money(payload.get("cash_received"), "Uang diterima")
        except ValueError as error:
            return api_error(str(error), 400)

        if cash_received < total:
            return api_error("Uang diterima kurang dari total pembayaran", 400)

        cash_change = cash_received - total

    transaction = Transaction(
        transaction_number=f"ARG-{waktu_wib().strftime('%Y%m%d%H%M%S%f')}",
        cashier_id=session.get("user_id"),
        customer_name=customer_name,
        subtotal=subtotal,
        tax=tax,
        total=total,
        payment_method=payment_method,
        cash_received=cash_received,
        cash_change=cash_change,
        status="COMPLETED",
    )

    try:
        db.session.add(transaction)
        db.session.flush()

        for menu_item, quantity, item_subtotal in prepared_items:
            db.session.add(TransactionItem(
                transaction_id=transaction.id,
                menu_item_id=menu_item.id,
                quantity=quantity,
                unit_price=menu_item.price,
                subtotal=item_subtotal,
            ))

        for requirement in stock_requirements.values():
            inventory = requirement["inventory"]
            used_quantity = requirement["quantity"]
            inventory.stok = Decimal(inventory.stok or 0) - used_quantity
            db.session.add(StockMovement(
                id_inventory=inventory.id_inventory,
                movement_type="OUT",
                quantity=used_quantity,
                reference_type="POS_SALE",
                reference_id=transaction.id,
                notes=(
                    f"Penjualan {transaction.transaction_number}: "
                    f"{', '.join(sorted(requirement['menus']))}"
                ),
                created_by=session.get("user_id"),
            ))

        db.session.commit()
        return api_success(
            serialize_transaction(transaction, include_items=True),
            "Checkout berhasil",
            201,
        )
    except Exception:
        db.session.rollback()
        return api_error("Checkout gagal diproses", 500)


@owner_bp.route("/api/receipt/<int:transaction_id>")
@role_name_required("OWNER", "FINANCE", "KASIR")
def receipt_api(transaction_id):
    transaction = Transaction.query.get(transaction_id)
    if not transaction:
        return api_error("Transaksi tidak ditemukan", 404)

    return api_success(serialize_transaction(transaction, include_items=True))


@owner_bp.route("/receipt/<int:transaction_id>")
@role_name_required("OWNER", "FINANCE", "KASIR")
def receipt_page(transaction_id):
    transaction = Transaction.query.get_or_404(transaction_id)
    return render_template("receipt.html", transaction=transaction)
    

# ======================================================
# SEMUA DATA KEHADIRAN
# ======================================================

@owner_bp.route("/api/staff/attendance/history")
@role_name_required("OWNER", "HRD", "FINANCE")
def attendance_history():

    try:

        sql = text("""

            SELECT

                st.full_name,

                a.attendance_date,

                a.clock_in,

                a.clock_out,

                sh.shift_name,

                a.status

            FROM attendance a

            JOIN staff st
                ON a.staff_id = st.id

            JOIN staff_schedules ss
                ON a.schedule_id = ss.id

            JOIN shifts sh
                ON ss.shift_id = sh.id

            ORDER BY
                a.attendance_date DESC,
                a.clock_in DESC

        """)

        result = db.session.execute(sql)

        data = []

        for row in result:

            data.append({

                "name": row.full_name,

                "date": row.attendance_date.strftime("%d/%m/%Y"),

                "clock_in":
                    row.clock_in.strftime("%H:%M")
                    if row.clock_in else "-",

                "clock_out":
                    row.clock_out.strftime("%H:%M")
                    if row.clock_out else "-",

                "shift": row.shift_name,

                "status": row.status

            })

        return jsonify({
            "success": True,
            "data": data
        })

    except Exception as e:

        print(e)

        return jsonify({
            "success": False,
            "message": str(e)
        }),500

@owner_bp.route("/api/staff/accounts", methods=["POST"])
def create_staff_account():

    try:

        data = request.get_json()

        fullname = data.get("fullname", "").strip()
        username = data.get("username", "").strip()
        password = data.get("password", "").strip()
        role = data.get("role", "").strip().upper()

        if not fullname or not username or not password or not role:
            return jsonify({
                "success": False,
                "message": "Data belum lengkap"
            }), 400

        # ==========================
        # Cari Role
        # ==========================
        role_row = db.session.execute(text("""
            SELECT id
            FROM roles
            WHERE UPPER(role_name)=:role
        """), {
            "role": role
        }).fetchone()

        if not role_row:
            return jsonify({
                "success": False,
                "message": "Role tidak ditemukan"
            }), 400

        # ==========================
        # Username sudah ada?
        # ==========================
        check = db.session.execute(text("""
            SELECT id
            FROM users
            WHERE username=:username
        """), {
            "username": username
        }).fetchone()

        if check:
            return jsonify({
                "success": False,
                "message": "Username sudah digunakan"
            }), 400

        # ==========================
        # Simpan User
        # ==========================
        # Hash password

        hashed = bcrypt.hashpw(
            password.encode("utf-8"),
            bcrypt.gensalt()
        ).decode("utf-8")

        db.session.execute(text("""
            INSERT INTO users
            (
                role_id,
                fullname,
                username,
                password,
                is_active
            )
            VALUES
            (
                :role_id,
                :fullname,
                :username,
                :password,
                1
            )
        """), {

            "role_id": role_row.id,
            "fullname": fullname,
            "username": username,
            "password": hashed

        })

        # Flush supaya INSERT benar-benar dikirim ke DB
        db.session.flush()

        # Ambil user_id berdasarkan username
        user_row = db.session.execute(text("""
            SELECT id
            FROM users
            WHERE username=:username
        """), {
            "username": username
        }).fetchone()

        if not user_row:
            raise Exception("User gagal dibuat")

        user_id = user_row.id

        employee_code = f"ARG{user_id:03}"

        # ==========================
        # Simpan Staff
        # ==========================
        db.session.execute(text("""
            INSERT INTO staff
            (
                user_id,
                employee_code,
                full_name,
                department,
                position,
                joined_at,
                status
            )
            VALUES
            (
                :user_id,
                :employee_code,
                :full_name,
                :department,
                :position,
                NOW(),
                'ACTIVE'
            )
        """), {

            "user_id": user_id,
            "employee_code": employee_code,
            "full_name": fullname,
            "department": role_group(role),
            "position": role_label(role)

        })

        db.session.commit()

        return jsonify({
            "success": True,
            "message": "Akun berhasil ditambahkan"
        })

    except Exception as e:

        db.session.rollback()

        print("ERROR CREATE STAFF :", e)

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

#nonaktifakn akun
@owner_bp.route("/api/staff/accounts/<int:user_id>", methods=["GET","DELETE"])
def staff_account(user_id):

    if request.method == "GET":

        row = db.session.execute(text("""

            SELECT
                users.id,
                users.fullname,
                users.username,
                roles.role_name

            FROM users

            JOIN roles
                ON users.role_id = roles.id

            WHERE users.id=:id

        """),{
            "id":user_id
        }).fetchone()

        if not row:
            return jsonify({
                "success":False,
                "message":"User tidak ditemukan"
            }),404

        return jsonify({
            "success":True,
            "data":{
                "id":row.id,
                "fullname":row.fullname,
                "username":row.username,
                "role": role_form_code(row.role_name)
            }
        })

    # DELETE
    db.session.execute(text("""
        UPDATE users
        SET is_active=0
        WHERE id=:id
    """),{
        "id":user_id
    })

    db.session.commit()

    return jsonify({
        "success":True,
        "message":"Akun berhasil dinonaktifkan"
    })

@owner_bp.route("/api/staff/accounts/<int:user_id>", methods=["PUT"])
def update_staff_account(user_id):

    try:

        data = request.get_json()

        fullname = data.get("fullname", "").strip()
        username = data.get("username", "").strip()
        role = data.get("role", "").strip().upper()
        password = data.get("password", "").strip()

        if not fullname or not username or not role:

            return jsonify({
                "success": False,
                "message": "Data belum lengkap"
            }), 400

        # cek user
        user = db.session.execute(text("""
            SELECT id
            FROM users
            WHERE id = :id
        """), {
            "id": user_id
        }).fetchone()

        if not user:

            return jsonify({
                "success": False,
                "message": "User tidak ditemukan"
            }), 404

        # cek username dipakai user lain
        check = db.session.execute(text("""
            SELECT id
            FROM users
            WHERE username = :username
            AND id <> :id
        """), {
            "username": username,
            "id": user_id
        }).fetchone()

        if check:

            return jsonify({
                "success": False,
                "message": "Username sudah digunakan"
            }), 400

        # cari role
        role_row = db.session.execute(text("""
            SELECT id
            FROM roles
            WHERE UPPER(role_name)=:role
        """), {
            "role": role
        }).fetchone()

        if not role_row:

            return jsonify({
                "success": False,
                "message": "Role tidak ditemukan"
            }), 400

        # update user
        if password:

            hashed = bcrypt.hashpw(
                password.encode("utf-8"),
                bcrypt.gensalt()
            ).decode("utf-8")

            db.session.execute(text("""
                UPDATE users
                SET
                    fullname=:fullname,
                    username=:username,
                    role_id=:role_id,
                    password=:password
                WHERE id=:id
            """), {

                "fullname": fullname,
                "username": username,
                "role_id": role_row.id,
                "password": hashed,
                "id": user_id

            })

        else:

            db.session.execute(text("""
                UPDATE users
                SET
                    fullname=:fullname,
                    username=:username,
                    role_id=:role_id
                WHERE id=:id
            """), {

                "fullname": fullname,
                "username": username,
                "role_id": role_row.id,
                "id": user_id

            })

        # update staff
        db.session.execute(text("""
            UPDATE staff
            SET
                full_name=:fullname,
                department=:department,
                position=:position
            WHERE user_id=:id
        """), {

            "fullname": fullname,
            "department": role_group(role),
            "position": role_label(role),
            "id": user_id

        })

        db.session.commit()

        return jsonify({
            "success": True,
            "message": "Akun berhasil diperbarui"
        })

    except Exception as e:

        db.session.rollback()

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

#hapus akun
@owner_bp.route("/api/staff/accounts/<int:user_id>/permanent", methods=["DELETE"])
def permanent_delete_staff_account(user_id):

    try:

        # cek user
        user = db.session.execute(text("""
            SELECT id
            FROM users
            WHERE id = :id
        """), {
            "id": user_id
        }).fetchone()

        if not user:

            return jsonify({
                "success": False,
                "message": "User tidak ditemukan"
            }), 404

        # hapus data staff dulu
        db.session.execute(text("""
            DELETE FROM staff
            WHERE user_id = :id
        """), {
            "id": user_id
        })

        # hapus user
        db.session.execute(text("""
            DELETE FROM users
            WHERE id = :id
        """), {
            "id": user_id
        })

        db.session.commit()

        return jsonify({
            "success": True,
            "message": "Akun berhasil dihapus"
        })

    except Exception as e:

        db.session.rollback()

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500
