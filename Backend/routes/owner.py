from flask import Blueprint, render_template
from utils.auth import login_required, role_required

owner_bp = Blueprint(
    "owner",
    __name__,
    url_prefix="/owner"
)
# ==========================
# OWNER DASHBOARD
# ==========================
@owner_bp.route("/dashboard")
@login_required
@role_required(1)
def owner_dashboard():
    return render_template("owner_dashboard.html")


@owner_bp.route("/inventory")
@login_required
@role_required(1)
def owner_inventory():
    return render_template("owner_inventory.html")