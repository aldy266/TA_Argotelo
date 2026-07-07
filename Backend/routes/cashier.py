from flask import Blueprint, redirect, render_template, url_for
from utils.auth import role_name_required

cashier_bp = Blueprint(
    "cashier",
    __name__,
    url_prefix="/cashier"
)

# ==========================
# CASHIER DASHBOARD
# ==========================

@cashier_bp.route("/dashboard")
@role_name_required("KASIR")
def dashboard():
    return redirect(url_for("cashier.pos"))


@cashier_bp.route("/pos")
@role_name_required("KASIR")
def pos():
    return render_template("cashier_dashboard.html")


@cashier_bp.route("/inventory")
@role_name_required("KASIR")
def inventory():
    return render_template("cashier_inventory.html")
