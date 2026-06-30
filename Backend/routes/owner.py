from flask import Blueprint, render_template, session, redirect

owner_bp = Blueprint("owner", __name__)

@owner_bp.route("/owner/dashboard")
def owner_dashboard():

    if "user_id" not in session:
        return redirect("/")

    return render_template("owner_dashboard.html")


@owner_bp.route("/owner/inventory")
def owner_inventory():

    if "user_id" not in session:
        return redirect("/")

    return render_template("owner_inventory.html")