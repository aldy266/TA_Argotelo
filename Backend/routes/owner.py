from flask import Blueprint, render_template, session, redirect

owner_bp = Blueprint("owner", __name__)

# ======================================
# OWNER DASHBOARD
# ======================================

@owner_bp.route("/owner/dashboard")
def owner_dashboard():

    if "user_id" not in session:
        return redirect("/")

    return render_template("owner_dashboard.html")


# ======================================
# OWNER INVENTORY
# ======================================

@owner_bp.route("/owner/inventory")
def owner_inventory():

    if "user_id" not in session:
        return redirect("/")

    return render_template("owner_inventory.html")


# ======================================
# OWNER STAFF
# ======================================

@owner_bp.route("/owner/staff")
def owner_staff():

    if "user_id" not in session:
        return redirect("/")

    return render_template("owner_staff.html")


# ======================================
# OWNER MENU MANAGEMENT
# ======================================

@owner_bp.route("/owner/menu")
def owner_menu():

    if "user_id" not in session:
        return redirect("/")

    return render_template("owner_menu.html")

# ======================================
# OWNER TRANSACTION
# ======================================

@owner_bp.route("/owner/transaction")
def owner_transaction():

    if "user_id" not in session:
        return redirect("/")

    return render_template("owner_transaction.html")