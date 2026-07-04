from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()


# ==========================
# ROLE
# ==========================

class Role(db.Model):

    __tablename__ = "roles"

    id = db.Column(db.Integer, primary_key=True)

    role_name = db.Column(
        db.String(50),
        unique=True,
        nullable=False
    )

    description = db.Column(
        db.String(255)
    )


# ==========================
# USER
# ==========================

class User(db.Model):

    __tablename__ = "users"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    role_id = db.Column(
        db.Integer,
        db.ForeignKey("roles.id"),
        nullable=False
    )

    fullname = db.Column(
        db.String(100),
        nullable=False
    )

    username = db.Column(
        db.String(50),
        unique=True,
        nullable=False
    )

    password = db.Column(
        db.String(255),
        nullable=False
    )

    email = db.Column(
        db.String(100),
        unique=True
    )

    phone = db.Column(
        db.String(20)
    )

    photo = db.Column(
        db.String(255)
    )

    is_active = db.Column(
        db.Boolean,
        default=True
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )

    updated_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    role = db.relationship(
        "Role",
        backref="users"
    )


# ==========================
# INVENTORY
# ==========================

class Inventory(db.Model):

    __tablename__ = "inventory"


    id_inventory = db.Column(
        db.Integer,
        primary_key=True
    )


    nama_bahan = db.Column(
        db.String(100),
        nullable=False
    )


    stok = db.Column(
        db.Numeric(10,2),
        nullable=False
    )


    satuan = db.Column(
        db.String(30),
        nullable=False
    )


    minimal_stok = db.Column(
        db.Numeric(10,2),
        nullable=False
    )


    supplier = db.Column(
        db.String(100)
    )


    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )


    updated_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

# ==========================
# PURCHASE ORDER
# ==========================

class PurchaseOrder(db.Model):

    __tablename__ = "purchase_orders"


    id_po = db.Column(
        db.Integer,
        primary_key=True
    )


    id_inventory = db.Column(
        db.Integer,
        db.ForeignKey("inventory.id_inventory"),
        nullable=False
    )


    jumlah_order = db.Column(
        db.Numeric(10,2),
        nullable=False
    )


    supplier = db.Column(
        db.String(100)
    )


    status = db.Column(
        db.Enum(
            "PENDING",
            "DIKIRIM",
            "SELESAI"
        ),
        default="PENDING"
    )


    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )


    updated_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )


    inventory = db.relationship(
        "Inventory",
        backref="purchase_orders"
    )