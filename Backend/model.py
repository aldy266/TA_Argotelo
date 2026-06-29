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