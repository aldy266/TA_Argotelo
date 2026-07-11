from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timedelta

db = SQLAlchemy()

# ==========================
# WAKTU INDONESIA (WIB)
# ==========================

def waktu_wib():

    return datetime.utcnow() + timedelta(hours=7)


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
        db.Text
    )
    is_active = db.Column(
        db.Boolean,
        default=True
    )

    created_at = db.Column(
        db.DateTime,
        default=waktu_wib
    )

    updated_at = db.Column(
        db.DateTime,
        default=waktu_wib,
        onupdate=waktu_wib
    )

    reset_token = db.Column(
        db.String(255)
    )


    reset_expired = db.Column(
        db.DateTime
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
        default=waktu_wib
    )


    updated_at = db.Column(
        db.DateTime,
        default=waktu_wib,
        onupdate=waktu_wib
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
        default=waktu_wib
    )


    updated_at = db.Column(
        db.DateTime,
        default=waktu_wib,
        onupdate=waktu_wib
    )


    inventory = db.relationship(
        "Inventory",
        backref="purchase_orders"
    )


# ==========================
# STOCK MOVEMENT
# ==========================

class StockMovement(db.Model):

    __tablename__ = "stock_movements"

    id = db.Column(db.Integer, primary_key=True)

    id_inventory = db.Column(
        db.Integer,
        db.ForeignKey("inventory.id_inventory"),
        nullable=False
    )

    movement_type = db.Column(
        db.Enum("IN", "OUT"),
        nullable=False
    )

    quantity = db.Column(
        db.Numeric(10, 2),
        nullable=False
    )

    reference_type = db.Column(
        db.String(50)
    )

    reference_id = db.Column(
        db.Integer
    )

    notes = db.Column(
        db.String(255)
    )

    created_by = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=True
    )

    created_at = db.Column(
        db.DateTime,
        default=waktu_wib
    )

    inventory = db.relationship(
        "Inventory",
        backref="stock_movements"
    )

    creator = db.relationship(
        "User",
        backref="stock_movements"
    )


# ==========================
# MENU ITEM
# ==========================

class MenuItem(db.Model):

    __tablename__ = "menu_items"

    id = db.Column(db.Integer, primary_key=True)

    name = db.Column(
        db.String(120),
        nullable=False
    )

    category = db.Column(
        db.String(80),
        nullable=False
    )

    price = db.Column(
        db.Numeric(12, 2),
        nullable=False
    )

    image_url = db.Column(
        db.Text
    )

    status = db.Column(
        db.Enum("ACTIVE", "INACTIVE"),
        default="ACTIVE"
    )

    created_at = db.Column(
        db.DateTime,
        default=waktu_wib
    )

    updated_at = db.Column(
        db.DateTime,
        default=waktu_wib,
        onupdate=waktu_wib
    )


class MenuRecipe(db.Model):

    __tablename__ = "menu_recipes"

    id = db.Column(db.Integer, primary_key=True)

    menu_item_id = db.Column(
        db.Integer,
        db.ForeignKey("menu_items.id", ondelete="CASCADE"),
        nullable=False
    )

    id_inventory = db.Column(
        db.Integer,
        db.ForeignKey("inventory.id_inventory"),
        nullable=False
    )

    quantity = db.Column(
        db.Numeric(10, 2),
        nullable=False
    )

    created_at = db.Column(
        db.DateTime,
        default=waktu_wib
    )

    updated_at = db.Column(
        db.DateTime,
        default=waktu_wib,
        onupdate=waktu_wib
    )

    menu_item = db.relationship(
        "MenuItem",
        backref=db.backref("recipes", cascade="all, delete-orphan")
    )

    inventory = db.relationship(
        "Inventory",
        backref="menu_recipes"
    )

    __table_args__ = (
        db.UniqueConstraint(
            "menu_item_id",
            "id_inventory",
            name="uq_menu_recipe_inventory"
        ),
    )


# ==========================
# TRANSACTION
# ==========================

class Transaction(db.Model):

    __tablename__ = "transactions"

    id = db.Column(db.Integer, primary_key=True)

    transaction_number = db.Column(
        db.String(50),
        unique=True,
        nullable=False
    )

    cashier_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=True
    )

    customer_name = db.Column(
        db.String(100),
        default="Umum"
    )

    subtotal = db.Column(
        db.Numeric(12, 2),
        nullable=False,
        default=0
    )

    tax = db.Column(
        db.Numeric(12, 2),
        nullable=False,
        default=0
    )

    total = db.Column(
        db.Numeric(12, 2),
        nullable=False,
        default=0
    )

    payment_method = db.Column(
        db.String(40),
        nullable=False
    )

    cash_received = db.Column(
        db.Numeric(12, 2),
        nullable=True
    )

    cash_change = db.Column(
        db.Numeric(12, 2),
        nullable=True
    )

    status = db.Column(
        db.Enum("COMPLETED", "CANCELLED"),
        default="COMPLETED"
    )

    created_at = db.Column(
        db.DateTime,
        default=waktu_wib
    )

    cashier = db.relationship(
        "User",
        backref="transactions"
    )

    items = db.relationship(
        "TransactionItem",
        backref="transaction",
        cascade="all, delete-orphan"
    )


class TransactionItem(db.Model):

    __tablename__ = "transaction_items"

    id = db.Column(db.Integer, primary_key=True)

    transaction_id = db.Column(
        db.Integer,
        db.ForeignKey("transactions.id"),
        nullable=False
    )

    menu_item_id = db.Column(
        db.Integer,
        db.ForeignKey("menu_items.id"),
        nullable=False
    )

    quantity = db.Column(
        db.Integer,
        nullable=False
    )

    unit_price = db.Column(
        db.Numeric(12, 2),
        nullable=False
    )

    subtotal = db.Column(
        db.Numeric(12, 2),
        nullable=False
    )

    menu_item = db.relationship(
        "MenuItem",
        backref="transaction_items"
    )


# ==========================
# STAFF
# ==========================

class Staff(db.Model):

    __tablename__ = "staff"

    id = db.Column(db.Integer, primary_key=True)

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=True
    )

    employee_code = db.Column(
        db.String(50),
        unique=True,
        nullable=False
    )

    full_name = db.Column(
        db.String(100),
        nullable=False
    )

    department = db.Column(
        db.String(100),
        nullable=False
    )

    position = db.Column(
        db.String(100),
        nullable=False
    )

    phone = db.Column(
        db.String(20)
    )

    email = db.Column(
        db.String(100)
    )

    joined_at = db.Column(
        db.DateTime,
        nullable=False
    )

    status = db.Column(
        db.Enum("ACTIVE", "INACTIVE"),
        default="ACTIVE"
    )

    created_at = db.Column(
        db.DateTime,
        default=waktu_wib
    )

    updated_at = db.Column(
        db.DateTime,
        default=waktu_wib,
        onupdate=waktu_wib
    )

    user = db.relationship("User", backref="staff_profile")
    schedules = db.relationship("StaffSchedule", backref="staff", cascade="all, delete-orphan")
    attendance_records = db.relationship("Attendance", backref="staff", cascade="all, delete-orphan")
    leave_requests = db.relationship("LeaveRequest", backref="staff", cascade="all, delete-orphan")


# ==========================
# SHIFT
# ==========================

class Shift(db.Model):

    __tablename__ = "shifts"

    id = db.Column(db.Integer, primary_key=True)

    shift_name = db.Column(
        db.String(100),
        nullable=False
    )

    start_time = db.Column(
        db.Time,
        nullable=False
    )

    end_time = db.Column(
        db.Time,
        nullable=False
    )

    tolerance_minutes = db.Column(
        db.Integer,
        default=10
    )

    status = db.Column(
        db.Enum("ACTIVE", "INACTIVE"),
        default="ACTIVE"
    )

    created_at = db.Column(
        db.DateTime,
        default=waktu_wib
    )

    updated_at = db.Column(
        db.DateTime,
        default=waktu_wib,
        onupdate=waktu_wib
    )

    schedules = db.relationship("StaffSchedule", backref="shift", cascade="all, delete-orphan")


# ==========================
# STAFF SCHEDULE
# ==========================

class StaffSchedule(db.Model):

    __tablename__ = "staff_schedules"

    id = db.Column(db.Integer, primary_key=True)

    staff_id = db.Column(
        db.Integer,
        db.ForeignKey("staff.id"),
        nullable=False
    )

    shift_id = db.Column(
        db.Integer,
        db.ForeignKey("shifts.id"),
        nullable=False
    )

    schedule_date = db.Column(
        db.Date,
        nullable=False
    )

    created_at = db.Column(
        db.DateTime,
        default=waktu_wib
    )

    updated_at = db.Column(
        db.DateTime,
        default=waktu_wib,
        onupdate=waktu_wib
    )

    attendance = db.relationship("Attendance", backref="schedule", uselist=False, cascade="all, delete-orphan")

    __table_args__ = (
        db.Index("idx_schedule_staff_date", "staff_id", "schedule_date"),
    )


# ==========================
# ATTENDANCE
# ==========================

class Attendance(db.Model):

    __tablename__ = "attendance"

    id = db.Column(db.Integer, primary_key=True)

    staff_id = db.Column(
        db.Integer,
        db.ForeignKey("staff.id"),
        nullable=False
    )

    schedule_id = db.Column(
        db.Integer,
        db.ForeignKey("staff_schedules.id"),
        nullable=False
    )

    attendance_date = db.Column(
        db.Date,
        nullable=False
    )

    clock_in = db.Column(
        db.DateTime,
        nullable=True
    )

    clock_out = db.Column(
        db.DateTime,
        nullable=True
    )

    status = db.Column(
        db.Enum("NOT_CHECKED_IN", "PRESENT", "LATE", "LEAVE", "SICK", "ABSENT", "COMPLETED"),
        default="NOT_CHECKED_IN"
    )

    late_minutes = db.Column(
        db.Integer,
        default=0
    )

    work_minutes = db.Column(
        db.Integer,
        default=0
    )

    created_at = db.Column(
        db.DateTime,
        default=waktu_wib
    )

    updated_at = db.Column(
        db.DateTime,
        default=waktu_wib,
        onupdate=waktu_wib
    )


# ==========================
# LEAVE REQUEST
# ==========================

class LeaveRequest(db.Model):

    __tablename__ = "leave_requests"

    id = db.Column(db.Integer, primary_key=True)

    staff_id = db.Column(
        db.Integer,
        db.ForeignKey("staff.id"),
        nullable=False
    )

    leave_type = db.Column(
        db.Enum("SICK", "LEAVE", "PERMISSION"),
        nullable=False
    )

    start_date = db.Column(
        db.Date,
        nullable=False
    )

    end_date = db.Column(
        db.Date,
        nullable=False
    )

    reason = db.Column(
        db.Text
    )

    document_url = db.Column(
        db.Text,
        nullable=True
    )

    status = db.Column(
        db.Enum("PENDING", "APPROVED", "REJECTED"),
        default="PENDING"
    )

    reviewed_by = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=True
    )

    reviewed_at = db.Column(
        db.DateTime,
        nullable=True
    )

    created_at = db.Column(
        db.DateTime,
        default=waktu_wib
    )

    reviewer = db.relationship("User", backref="leave_reviews")
