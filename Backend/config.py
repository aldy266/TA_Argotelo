import os
from pathlib import Path
from urllib.parse import quote_plus

import certifi
from dotenv import load_dotenv


BASE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BASE_DIR.parent

# Load root .env first, then Backend/.env so the existing project layout works
# when the app is started from the repository root.
load_dotenv(PROJECT_ROOT / ".env", override=False)
load_dotenv(BASE_DIR / ".env", override=True)


def _env(name, default=None):
    value = os.getenv(name)
    if value is None or value == "":
        return default
    return value


def _build_database_uri():
    db_host = _env("DB_HOST")
    db_port = _env("DB_PORT", "4000")
    db_user = _env("DB_USER")
    db_password = _env("DB_PASSWORD")
    db_name = _env("DB_NAME")

    if all([db_host, db_port, db_user, db_password, db_name]):
        return (
            "mysql+pymysql://"
            f"{quote_plus(db_user)}:{quote_plus(db_password)}@"
            f"{db_host}:{db_port}/{quote_plus(db_name)}?charset=utf8mb4"
        )

    local_db = BASE_DIR / "instance" / "argotelo_dev.sqlite3"
    local_db.parent.mkdir(exist_ok=True)
    return "sqlite:///" + local_db.as_posix()


def _engine_options(database_uri):
    if database_uri.startswith("mysql+pymysql://"):
        return {
            "connect_args": {
                "ssl": {
                    "ca": certifi.where()
                }
            },
            "pool_pre_ping": True,
            "pool_recycle": 280,
            "pool_timeout": 30
        }

    return {
        "pool_pre_ping": True
    }


class Config:
    SECRET_KEY = _env("SECRET_KEY", "argotelo-dev-secret")
    SQLALCHEMY_DATABASE_URI = _build_database_uri()
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = _engine_options(SQLALCHEMY_DATABASE_URI)
    MAX_CONTENT_LENGTH = int(_env("MAX_UPLOAD_SIZE", 5 * 1024 * 1024))
    POS_TAX_RATE = float(_env("POS_TAX_RATE", 0))
