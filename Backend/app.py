from flask import Flask
from flask_cors import CORS

from config import Config
from model import db
from routes.auth import auth_bp

app = Flask(__name__)

# Konfigurasi
app.config.from_object(Config)

# Secret Key
app.secret_key = Config.SECRET_KEY

# CORS
CORS(app)

# Inisialisasi Database
db.init_app(app)

app.register_blueprint(auth_bp)

@app.route("/")
def home():
    return {
        "success": True,
        "message": "AMSP Backend Running"
    }


if __name__ == "__main__":

    with app.app_context():
        db.create_all()

    app.run(
        debug=True,
        host="0.0.0.0",
        port=5000
    )