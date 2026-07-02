from flask import Flask, render_template
from flask_cors import CORS
import os

from config import Config
from model import db
from routes.auth import auth_bp
from routes.owner import owner_bp
from routes.cashier import cashier_bp
from routes.finance import finance_bp

app = Flask(__name__)

# Konfigurasi
app.config.from_object(Config)

# Secret Key
app.secret_key = Config.SECRET_KEY

app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
app.config["SESSION_COOKIE_HTTPONLY"] = True

CORS(app, supports_credentials=True)

db.init_app(app)

app.register_blueprint(auth_bp)
app.register_blueprint(owner_bp)
app.register_blueprint(cashier_bp)
app.register_blueprint(finance_bp)

@app.route("/")
def login_page():
    return render_template("login.html")

@app.route("/register")
def register_page():
    return render_template("register.html")

if __name__ == "__main__":
    with app.app_context():
        db.create_all()

    app.run(
        debug=True,
        host="0.0.0.0",
        port=5000
    )