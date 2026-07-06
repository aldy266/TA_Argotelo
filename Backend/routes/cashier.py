from flask import Blueprint, render_template
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

    return render_template("cashier_dashboard.html")
