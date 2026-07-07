from datetime import datetime, time
import io

from flask import Blueprint, jsonify, redirect, render_template, request, send_file, url_for
from openpyxl import Workbook
from sqlalchemy import func

from model import Transaction
from model import db
from utils.auth import role_name_required

finance_bp = Blueprint(
    "finance",
    __name__,
    url_prefix="/finance"
)

# ==========================
# FINANCE DASHBOARD
# ==========================

@finance_bp.route("/dashboard")
@role_name_required("FINANCE")
def dashboard():
    return redirect(url_for("owner.owner_dashboard"))


def api_error(message, status=400):
    return jsonify({
        "success": False,
        "message": message
    }), status


def parse_date(value):
    if not value:
        return None
    return datetime.fromisoformat(value).date()


def transaction_query():
    query = Transaction.query.filter_by(status="COMPLETED")

    date_from = request.args.get("date_from")
    date_to = request.args.get("date_to")

    if date_from:
        query = query.filter(
            Transaction.created_at >= datetime.combine(parse_date(date_from), time.min)
        )

    if date_to:
        query = query.filter(
            Transaction.created_at <= datetime.combine(parse_date(date_to), time.max)
        )

    return query


@finance_bp.route("/api/dashboard")
@role_name_required("FINANCE", "OWNER")
def finance_dashboard_api():
    try:
        query = transaction_query()
    except Exception:
        return api_error("Filter tanggal tidak valid", 400)

    revenue = query.with_entities(
        func.coalesce(func.sum(Transaction.total), 0)
    ).scalar()

    transaction_count = query.count()
    average_transaction = float(revenue or 0) / transaction_count if transaction_count else 0

    return jsonify({
        "success": True,
        "message": "Berhasil",
        "data": {
            "revenue": float(revenue or 0),
            "transaction_count": transaction_count,
            "average_transaction": average_transaction
        }
    })


@finance_bp.route("/api/report/export")
@role_name_required("FINANCE", "OWNER")
def finance_report_export():
    try:
        transactions = transaction_query().order_by(Transaction.created_at.desc()).all()
    except Exception:
        return api_error("Filter tanggal tidak valid", 400)

    workbook = Workbook()
    sheet = workbook.active
    sheet.title = "Finance Report"
    sheet.append([
        "Tanggal",
        "Nomor Transaksi",
        "Kasir",
        "Subtotal",
        "Pajak",
        "Total",
        "Metode Pembayaran"
    ])

    for transaction in transactions:
        sheet.append([
            transaction.created_at.strftime("%Y-%m-%d %H:%M") if transaction.created_at else "",
            transaction.transaction_number,
            transaction.cashier.fullname if transaction.cashier else "-",
            float(transaction.subtotal or 0),
            float(transaction.tax or 0),
            float(transaction.total or 0),
            transaction.payment_method
        ])

    file = io.BytesIO()
    workbook.save(file)
    file.seek(0)

    return send_file(
        file,
        as_attachment=True,
        download_name="Laporan_Finance_Argotelo.xlsx",
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )
