from flask import Blueprint, render_template
from utils.auth import login_required, role_required

finance_bp = Blueprint(
    "finance",
    __name__,
    url_prefix="/finance"
)

# ==========================
# FINANCE DASHBOARD
# ==========================

@finance_bp.route("/dashboard")
@login_required
@role_required(2)
def dashboard():

    return render_template("finance_dashboard.html")