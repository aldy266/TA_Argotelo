from pathlib import Path
import sys


ROOT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = ROOT_DIR / "Backend"

if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app import app, initialize_database


if __name__ == "__main__":
    with app.app_context():
        initialize_database()

    app.run(debug=True, host="0.0.0.0", port=5000)
