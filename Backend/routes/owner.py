from datetime import datetime, time, timedelta
from decimal import Decimal
import io
import os

import cloudinary.uploader
from flask import Blueprint, current_app, jsonify, render_template, request, send_file, session
from openpyxl import Workbook
from sqlalchemy import func, or_

from model import (
    Attendance,
    Inventory,
    MenuItem,
    StaffSchedule,
    Transaction,
    TransactionItem,
    User,
    db,
    waktu_wib,
)
from utils.auth import role_name_required


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


def serialize_menu_item(item):
    return {
        "id": item.id,
        "name": item.name,
        "category": item.category,
        "price": rupiah_value(item.price),
        "image_url": item.image_url,
        "status": item.status,
        "created_at": item.created_at.isoformat() if item.created_at else None,
    }


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
@role_name_required("OWNER")
def owner_dashboard():
    return render_template("owner_dashboard.html")


@owner_bp.route("/owner/inventory")
@role_name_required("OWNER")
def owner_inventory():
    return render_template("owner_inventory.html")


@owner_bp.route("/owner/staff")
@role_name_required("OWNER", "HRD")
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

    month_start = waktu_wib().date().replace(day=1)
    monthly_income = db.session.query(func.coalesce(func.sum(Transaction.total), 0)).filter(
        Transaction.created_at >= datetime.combine(month_start, time.min),
        Transaction.created_at <= datetime.combine(waktu_wib().date(), time.max),
        Transaction.status == "COMPLETED",
    ).scalar()

    today = waktu_wib().date()
    total_scheduled = StaffSchedule.query.filter_by(schedule_date=today).count()
    present_count = Attendance.query.filter(
        Attendance.attendance_date == today,
        Attendance.status.in_(["PRESENT", "LATE", "COMPLETED"]),
    ).count()

    weekly_sales = []
    max_sales = Decimal("0")
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
            "label": day.strftime("%a"),
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

    recent_transactions = Transaction.query.filter_by(
        status="COMPLETED"
    ).order_by(Transaction.created_at.desc()).limit(5).all()

    return api_success({
        "statistics": {
            "sales": rupiah_value(sales_total),
            "transaction_count": transaction_count,
            "monthly_income": rupiah_value(monthly_income),
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
    return api_success([serialize_menu_item(item) for item in items])


@owner_bp.route("/api/menu-items", methods=["POST"])
@role_name_required("OWNER")
def create_menu_item():
    data = request.form if request.form else (request.get_json(silent=True) or {})

    name = (data.get("name") or "").strip()
    category = (data.get("category") or "").strip()
    price = data.get("price")

    if not name or not category:
        return api_error("Nama menu dan kategori wajib diisi", 400)

    try:
        price = Decimal(str(price))
    except Exception:
        return api_error("Harga tidak valid", 400)

    if price < 0:
        return api_error("Harga tidak boleh negatif", 400)

    try:
        image_url = upload_menu_image(request.files.get("image_file"))
    except ValueError as error:
        return api_error(str(error), 400)

    item = MenuItem(
        name=name,
        category=category,
        price=price,
        image_url=image_url or data.get("image_url"),
        status="ACTIVE",
    )

    try:
        db.session.add(item)
        db.session.commit()
        return api_success(serialize_menu_item(item), "Menu berhasil ditambahkan", 201)
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

    if not name or not category:
        return api_error("Nama menu dan kategori wajib diisi", 400)

    try:
        price = Decimal(str(price))
    except Exception:
        return api_error("Harga tidak valid", 400)

    if price < 0:
        return api_error("Harga tidak boleh negatif", 400)

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
    item.status = data.get("status") or item.status

    try:
        db.session.commit()
        return api_success(serialize_menu_item(item), "Menu berhasil diperbarui")
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


@owner_bp.route("/api/pos/checkout", methods=["POST"])
@role_name_required("OWNER", "KASIR")
def pos_checkout():
    payload = request.get_json(silent=True) or {}
    items = payload.get("items") or []
    payment_method = (payload.get("payment_method") or "").strip().upper()
    customer_name = (payload.get("customer_name") or "Umum").strip()

    if not items:
        return api_error("Keranjang masih kosong", 400)
    if not payment_method:
        return api_error("Metode pembayaran wajib dipilih", 400)

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

        item_subtotal = Decimal(menu_item.price) * Decimal(quantity)
        subtotal += item_subtotal
        prepared_items.append((menu_item, quantity, item_subtotal))

    tax_rate = Decimal(str(current_app.config.get("POS_TAX_RATE", 0)))
    tax = (subtotal * tax_rate).quantize(Decimal("1")) if tax_rate else Decimal("0")
    total = subtotal + tax

    transaction = Transaction(
        transaction_number=f"ARG-{waktu_wib().strftime('%Y%m%d%H%M%S%f')}",
        cashier_id=session.get("user_id"),
        customer_name=customer_name or "Umum",
        subtotal=subtotal,
        tax=tax,
        total=total,
        payment_method=payment_method,
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
