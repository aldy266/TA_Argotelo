from flask import Blueprint, render_template
from utils.auth import login_required, role_required

cashier_bp = Blueprint(
    "cashier",
    __name__,
    url_prefix="/cashier"
)

# ==========================
# CASHIER DASHBOARD
# ==========================

@cashier_bp.route("/dashboard")
@login_required
@role_required(3)
def dashboard():

    return render_template("cashier_dashboard.html")