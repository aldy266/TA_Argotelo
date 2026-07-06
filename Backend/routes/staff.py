import io
import re
from pathlib import Path

from flask import Blueprint, request, jsonify, session, send_file
from datetime import datetime, timedelta, date, time
from functools import wraps
from sqlalchemy import func
from openpyxl import Workbook, load_workbook
from openpyxl.styles import Alignment, Font, PatternFill
from model import db, Staff, Shift, StaffSchedule, Attendance, LeaveRequest, User

staff_bp = Blueprint("staff_api", __name__, url_prefix="/api/staff")

STAFF_IMPORT_HEADERS = [
    "employee_code",
    "full_name",
    "department",
    "position",
    "phone",
    "email",
    "joined_at",
    "status",
]
STAFF_IMPORT_REQUIRED = ["employee_code", "full_name", "department"]
ALLOWED_STAFF_STATUS = {"ACTIVE", "INACTIVE"}
MAX_IMPORT_SIZE = 5 * 1024 * 1024
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
BASE_DIR = Path(__file__).resolve().parents[1]
SAMPLE_DATA_DIR = BASE_DIR / "sample_data"
DUMMY_STAFF_FILE = SAMPLE_DATA_DIR / "data_dummy_staff.xlsx"

# ====================================================
# AUTHORIZATION HELPERS
# ====================================================

def require_auth():
    """Validate user is authenticated"""
    if "user_id" not in session:
        return None
    return session.get("user_id")

def require_role(*roles):
    """Validate user has required role"""
    user_id = require_auth()
    if not user_id:
        return None
    
    user = User.query.get(user_id)
    if not user:
        return None
    
    aliases = {
        "CASHIER": "KASIR"
    }
    allowed_roles = {
        aliases.get(role.upper(), role.upper())
        for role in roles
    }
    user_role = user.role.role_name.upper()

    if user_role not in allowed_roles:
        return None
    
    return user

def check_authorization(*required_roles):
    """Decorator to check authorization"""
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            user = require_role(*required_roles)
            if not user:
                status = 401 if "user_id" not in session else 403
                return jsonify({
                    "success": False,
                    "message": "Belum login" if status == 401 else "Akses ditolak"
                }), status
            return f(user, *args, **kwargs)
        return wrapper
    return decorator

def waktu_wib():
    """Indonesia timezone"""
    return datetime.utcnow() + timedelta(hours=7)


def normalize_cell(value):
    if value is None:
        return ""
    return str(value).strip()


def normalize_header(value):
    return normalize_cell(value).lower()


def parse_joined_at(value):
    if value in (None, ""):
        return datetime.combine(waktu_wib().date(), time.min)

    if isinstance(value, datetime):
        return datetime.combine(value.date(), time.min)

    if isinstance(value, date):
        return datetime.combine(value, time.min)

    value = normalize_cell(value)
    try:
        parsed = datetime.strptime(value, "%Y-%m-%d")
        return datetime.combine(parsed.date(), time.min)
    except ValueError as exc:
        raise ValueError("joined_at harus berformat YYYY-MM-DD") from exc


def format_staff_import_sheet(workbook, sheet_name):
    sheet = workbook.active
    sheet.title = sheet_name
    sheet.append(STAFF_IMPORT_HEADERS)

    header_fill = PatternFill("solid", fgColor="5A3718")
    header_font = Font(bold=True, color="FFFFFF")

    for cell in sheet[1]:
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = Alignment(horizontal="center")

    sheet.freeze_panes = "A2"

    widths = {
        "A": 18,
        "B": 24,
        "C": 18,
        "D": 20,
        "E": 18,
        "F": 28,
        "G": 14,
        "H": 14,
    }

    for column, width in widths.items():
        sheet.column_dimensions[column].width = width

    return sheet


def build_staff_template_workbook():
    workbook = Workbook()
    sheet = format_staff_import_sheet(workbook, "Staff Import")
    sheet.append([
        "STF001",
        "Nama Staff",
        "TIM TOKO",
        "Kasir",
        "081234567890",
        "staff@example.com",
        "2026-01-15",
        "ACTIVE",
    ])

    guide = workbook.create_sheet("Petunjuk")
    guide.append(["Kolom", "Keterangan"])
    guide["A1"].font = Font(bold=True, color="FFFFFF")
    guide["B1"].font = Font(bold=True, color="FFFFFF")
    guide["A1"].fill = PatternFill("solid", fgColor="5A3718")
    guide["B1"].fill = PatternFill("solid", fgColor="5A3718")
    guide.column_dimensions["A"].width = 22
    guide.column_dimensions["B"].width = 70
    guide.freeze_panes = "A2"
    guide_rows = [
        ("employee_code", "Kode Staff unik dan wajib."),
        ("full_name", "Nama lengkap Staff dan wajib."),
        ("department", "Divisi Staff dan wajib."),
        ("position", "Jabatan Staff."),
        ("phone", "Nomor telepon."),
        ("email", "Email Staff."),
        ("joined_at", "Format YYYY-MM-DD."),
        ("status", "ACTIVE atau INACTIVE. Jika kosong akan menjadi ACTIVE."),
    ]
    for row in guide_rows:
        guide.append(row)

    return workbook


def build_dummy_staff_workbook():
    workbook = Workbook()
    sheet = format_staff_import_sheet(workbook, "Staff Dummy Data")
    dummy_rows = [
        ["STF001", "Ahmad Ridwan", "TIM TOKO", "Kasir", "081234567801", "ahmad.ridwan@example.com", "2025-01-10", "ACTIVE"],
        ["STF002", "Siti Aminah", "TIM TOKO", "Kasir", "081234567802", "siti.aminah@example.com", "2025-01-15", "ACTIVE"],
        ["STF003", "Budi Santoso", "OPERASIONAL", "Supervisor Toko", "081234567803", "budi.santoso@example.com", "2025-02-01", "ACTIVE"],
        ["STF004", "Maya Putri", "FINANCE", "Staff Finance", "081234567804", "maya.putri@example.com", "2025-02-10", "ACTIVE"],
        ["STF005", "Danu Pratama", "TIM TOKO", "Kasir", "081234567805", "danu.pratama@example.com", "2025-02-17", "ACTIVE"],
        ["STF006", "Rina Kurnia", "HRD", "HR Staff", "081234567806", "rina.kurnia@example.com", "2025-03-01", "ACTIVE"],
        ["STF007", "Fajar Nugroho", "OPERASIONAL", "Staff Gudang", "081234567807", "fajar.nugroho@example.com", "2025-03-12", "ACTIVE"],
        ["STF008", "Nabila Rahma", "TIM TOKO", "Kasir", "081234567808", "nabila.rahma@example.com", "2025-04-01", "ACTIVE"],
        ["STF009", "Reza Maulana", "FINANCE", "Staff Finance", "081234567809", "reza.maulana@example.com", "2025-04-15", "ACTIVE"],
        ["STF010", "Intan Permata", "OPERASIONAL", "Staff Gudang", "081234567810", "intan.permata@example.com", "2025-05-02", "ACTIVE"],
    ]

    for row in dummy_rows:
        sheet.append(row)

    for row in sheet.iter_rows(min_row=2, max_col=len(STAFF_IMPORT_HEADERS)):
        for cell in row:
            cell.alignment = Alignment(vertical="center")

    return workbook


def workbook_response(workbook, filename):
    output = io.BytesIO()
    workbook.save(output)
    output.seek(0)
    return send_file(
        output,
        as_attachment=True,
        download_name=filename,
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )


def validate_import_file(file_storage):
    if not file_storage or not file_storage.filename:
        return "File Excel belum dipilih."

    if not file_storage.filename.lower().endswith(".xlsx"):
        return "Format file harus .xlsx."

    content_length = request.content_length or 0
    if content_length > MAX_IMPORT_SIZE:
        return "Ukuran file maksimal 5 MB."

    current_pos = file_storage.stream.tell()
    file_storage.stream.seek(0, io.SEEK_END)
    size = file_storage.stream.tell()
    file_storage.stream.seek(current_pos)

    if size > MAX_IMPORT_SIZE:
        return "Ukuran file maksimal 5 MB."

    return None


def row_is_empty(row_values):
    return all(value in (None, "") or normalize_cell(value) == "" for value in row_values)

# ====================================================
# STAFF IMPORT EXCEL
# ====================================================

@staff_bp.route("/import-template", methods=["GET"])
@check_authorization("OWNER", "HRD")
def download_import_template(user):
    workbook = build_staff_template_workbook()
    return workbook_response(workbook, "template_import_staff.xlsx")


@staff_bp.route("/dummy-excel", methods=["GET"])
@check_authorization("OWNER", "HRD")
def download_dummy_staff_excel(user):
    if DUMMY_STAFF_FILE.exists():
        return send_file(
            DUMMY_STAFF_FILE,
            as_attachment=True,
            download_name="data_dummy_staff.xlsx",
            mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )

    workbook = build_dummy_staff_workbook()
    return workbook_response(workbook, "data_dummy_staff.xlsx")


@staff_bp.route("/import-excel", methods=["POST"])
@check_authorization("OWNER", "HRD")
def import_staff_excel(user):
    file_storage = request.files.get("file")
    validation_error = validate_import_file(file_storage)

    if validation_error:
        return jsonify({
            "success": False,
            "message": validation_error
        }), 400

    try:
        file_storage.stream.seek(0)
        workbook = load_workbook(file_storage.stream, data_only=True)
    except Exception:
        return jsonify({
            "success": False,
            "message": "File Excel tidak dapat dibaca"
        }), 400

    sheet = workbook.active

    if sheet.max_row < 1:
        return jsonify({
            "success": False,
            "message": "File Excel tidak memiliki header"
        }), 400

    raw_headers = [cell.value for cell in sheet[1]]
    headers = [normalize_header(value) for value in raw_headers]
    header_map = {
        header: index
        for index, header in enumerate(headers)
        if header
    }

    missing_columns = [
        column
        for column in STAFF_IMPORT_REQUIRED
        if column not in header_map
    ]

    if missing_columns:
        return jsonify({
            "success": False,
            "message": "Kolom wajib tidak lengkap",
            "missing_columns": missing_columns
        }), 400

    total_rows = 0
    imported = 0
    skipped = 0
    failed = 0
    errors = []
    seen_codes = set()
    staff_to_insert = []

    existing_codes = {
        staff.employee_code
        for staff in Staff.query.with_entities(Staff.employee_code).all()
    }

    for excel_row_number, row in enumerate(
        sheet.iter_rows(min_row=2, values_only=True),
        start=2
    ):
        row_values = list(row)
        if row_is_empty(row_values):
            continue

        total_rows += 1

        def get_value(column):
            index = header_map.get(column)
            if index is None or index >= len(row_values):
                return ""
            return row_values[index]

        employee_code = normalize_cell(get_value("employee_code"))
        full_name = normalize_cell(get_value("full_name"))
        department = normalize_cell(get_value("department"))
        position = normalize_cell(get_value("position")) or "Staff"
        phone = normalize_cell(get_value("phone"))
        email = normalize_cell(get_value("email"))
        raw_joined_at = get_value("joined_at")
        status = normalize_cell(get_value("status")).upper() or "ACTIVE"

        row_errors = []

        if not employee_code:
            row_errors.append("employee_code wajib diisi")

        if not full_name:
            row_errors.append("full_name wajib diisi")

        if not department:
            row_errors.append("department wajib diisi")

        if employee_code and employee_code in seen_codes:
            row_errors.append("employee_code duplicate dalam file Excel")

        if email and not EMAIL_RE.match(email):
            row_errors.append("Email tidak valid")

        if status not in ALLOWED_STAFF_STATUS:
            row_errors.append("status harus ACTIVE atau INACTIVE")

        try:
            joined_at = parse_joined_at(raw_joined_at)
        except ValueError as error:
            joined_at = None
            row_errors.append(str(error))

        if row_errors:
            failed += 1
            errors.append({
                "row": excel_row_number,
                "employee_code": employee_code,
                "message": "; ".join(row_errors)
            })
            if employee_code:
                seen_codes.add(employee_code)
            continue

        seen_codes.add(employee_code)

        if employee_code in existing_codes:
            skipped += 1
            continue

        staff_to_insert.append(Staff(
            employee_code=employee_code,
            full_name=full_name,
            department=department,
            position=position,
            phone=phone or None,
            email=email or None,
            joined_at=joined_at,
            status=status
        ))
        existing_codes.add(employee_code)
        imported += 1

    try:
        if staff_to_insert:
            db.session.add_all(staff_to_insert)
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({
            "success": False,
            "message": "Import gagal disimpan ke database"
        }), 500

    return jsonify({
        "success": True,
        "message": "Import data Staff selesai",
        "data": {
            "total_rows": total_rows,
            "imported": imported,
            "skipped": skipped,
            "failed": failed,
            "errors": errors
        }
    }), 200


# ====================================================
# STAFF MANAGEMENT
# ====================================================

@staff_bp.route("", methods=["GET"])
@check_authorization("OWNER", "HRD")
def get_staff(user):
    """Get all active staff"""
    try:
        include_inactive = request.args.get("include_inactive") == "1"
        query = Staff.query

        if not include_inactive:
            query = query.filter_by(status="ACTIVE")

        staff = query.order_by(Staff.full_name.asc()).all()
        
        data = [{
            "id": s.id,
            "employee_code": s.employee_code,
            "full_name": s.full_name,
            "department": s.department,
            "position": s.position,
            "phone": s.phone,
            "email": s.email,
            "joined_at": s.joined_at.isoformat(),
            "status": s.status,
            "created_at": s.created_at.isoformat()
        } for s in staff]
        
        return jsonify({
            "success": True,
            "data": data
        }), 200
    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

@staff_bp.route("", methods=["POST"])
@check_authorization("OWNER", "HRD")
def create_staff(user):
    """Create new staff"""
    try:
        data = request.get_json()
        
        # Validasi
        if not data.get("full_name") or not data.get("employee_code"):
            return jsonify({
                "success": False,
                "message": "Nama lengkap dan kode karyawan wajib diisi"
            }), 400
        
        if not data.get("department") or not data.get("position"):
            return jsonify({
                "success": False,
                "message": "Divisi dan jabatan wajib diisi"
            }), 400
        
        # Cek duplikasi employee_code
        existing = Staff.query.filter_by(employee_code=data["employee_code"]).first()
        if existing:
            return jsonify({
                "success": False,
                "message": "Kode karyawan sudah terdaftar"
            }), 409
        
        # Cek email unique jika diberikan
        if data.get("email"):
            existing_email = Staff.query.filter_by(email=data["email"]).first()
            if existing_email:
                return jsonify({
                    "success": False,
                    "message": "Email sudah terdaftar"
                }), 409
        
        joined_at = datetime.fromisoformat(data.get("joined_at", waktu_wib().isoformat()))
        
        staff = Staff(
            full_name=data["full_name"],
            employee_code=data["employee_code"],
            department=data["department"],
            position=data["position"],
            phone=data.get("phone"),
            email=data.get("email"),
            joined_at=joined_at,
            status="ACTIVE"
        )
        
        db.session.add(staff)
        db.session.commit()
        
        return jsonify({
            "success": True,
            "message": f"{staff.full_name} berhasil ditambahkan",
            "data": {
                "id": staff.id,
                "employee_code": staff.employee_code,
                "full_name": staff.full_name
            }
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

@staff_bp.route("/<int:staff_id>", methods=["PUT"])
@check_authorization("OWNER", "HRD")
def update_staff(user, staff_id):
    """Update staff"""
    try:
        staff = Staff.query.get(staff_id)
        if not staff:
            return jsonify({
                "success": False,
                "message": "Staff tidak ditemukan"
            }), 404
        
        data = request.get_json()
        
        # Update fields yang dapat diubah
        if "full_name" in data:
            staff.full_name = data["full_name"]
        if "department" in data:
            staff.department = data["department"]
        if "position" in data:
            staff.position = data["position"]
        if "phone" in data:
            staff.phone = data["phone"]
        if "email" in data:
            staff.email = data["email"]
        if "joined_at" in data:
            staff.joined_at = datetime.fromisoformat(data["joined_at"])
        
        db.session.commit()
        
        return jsonify({
            "success": True,
            "message": "Staff berhasil diupdate",
            "data": {
                "id": staff.id,
                "full_name": staff.full_name
            }
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

@staff_bp.route("/<int:staff_id>/deactivate", methods=["PATCH"])
@check_authorization("OWNER", "HRD")
def deactivate_staff(user, staff_id):
    """Deactivate staff (soft delete)"""
    try:
        staff = Staff.query.get(staff_id)
        if not staff:
            return jsonify({
                "success": False,
                "message": "Staff tidak ditemukan"
            }), 404
        
        staff.status = "INACTIVE"
        db.session.commit()
        
        return jsonify({
            "success": True,
            "message": f"{staff.full_name} berhasil dinonaktifkan"
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

# ====================================================
# SHIFT MANAGEMENT
# ====================================================

@staff_bp.route("/shift", methods=["GET"])
@check_authorization("OWNER", "HRD")
def get_shifts(user):
    """Get all active shifts"""
    try:
        shifts = Shift.query.filter_by(status="ACTIVE").all()
        
        data = [{
            "id": s.id,
            "shift_name": s.shift_name,
            "start_time": s.start_time.isoformat(),
            "end_time": s.end_time.isoformat(),
            "tolerance_minutes": s.tolerance_minutes
        } for s in shifts]
        
        return jsonify({
            "success": True,
            "data": data
        }), 200
    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

# ====================================================
# SCHEDULE MANAGEMENT
# ====================================================

@staff_bp.route("/schedule", methods=["POST"])
@check_authorization("OWNER", "HRD")
def create_schedule(user):
    """Create staff schedule"""
    try:
        data = request.get_json()
        
        if not data.get("staff_id") or not data.get("shift_id"):
            return jsonify({
                "success": False,
                "message": "Staff dan Shift wajib dipilih"
            }), 400
        
        schedule_date = datetime.fromisoformat(data.get("schedule_date")).date()
        
        # Cek apakah staff sudah punya jadwal di tanggal tersebut
        existing = StaffSchedule.query.filter_by(
            staff_id=data["staff_id"],
            schedule_date=schedule_date
        ).first()
        
        if existing:
            return jsonify({
                "success": False,
                "message": "Staff sudah memiliki jadwal pada tanggal tersebut"
            }), 409
        
        schedule = StaffSchedule(
            staff_id=data["staff_id"],
            shift_id=data["shift_id"],
            schedule_date=schedule_date
        )
        
        db.session.add(schedule)
        db.session.commit()
        
        # Buat Attendance record
        attendance = Attendance(
            staff_id=data["staff_id"],
            schedule_id=schedule.id,
            attendance_date=schedule_date,
            status="NOT_CHECKED_IN"
        )
        
        db.session.add(attendance)
        db.session.commit()
        
        return jsonify({
            "success": True,
            "message": "Jadwal berhasil ditambahkan",
            "data": {
                "id": schedule.id,
                "schedule_date": schedule_date.isoformat()
            }
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

# ====================================================
# ATTENDANCE - GET TODAY'S ATTENDANCE WITH SCHEDULE
# ====================================================

@staff_bp.route("/attendance/today", methods=["GET"])
@check_authorization("OWNER", "HRD", "CASHIER")
def get_today_attendance(user):
    """Get today's attendance data (includes scheduled staff not checked in yet)"""
    try:
        today = waktu_wib().date()
        
        # Query: Staff Schedule + Staff + Shift + LEFT JOIN Attendance
        query = db.session.query(
            Staff.id,
            Staff.employee_code,
            Staff.full_name,
            Staff.department,
            Staff.position,
            Shift.shift_name,
            Shift.start_time,
            Shift.end_time,
            Shift.tolerance_minutes,
            Attendance.clock_in,
            Attendance.clock_out,
            Attendance.status,
            Attendance.late_minutes,
            Attendance.work_minutes,
            StaffSchedule.id.label("schedule_id")
        ).join(
            StaffSchedule, Staff.id == StaffSchedule.staff_id
        ).join(
            Shift, StaffSchedule.shift_id == Shift.id
        ).outerjoin(
            Attendance, StaffSchedule.id == Attendance.schedule_id
        ).filter(
            StaffSchedule.schedule_date == today,
            Staff.status == "ACTIVE"
        ).all()
        
        data = []
        for row in query:
            data.append({
                "id": row.id,
                "schedule_id": row.schedule_id,
                "employee_code": row.employee_code,
                "full_name": row.full_name,
                "department": row.department,
                "position": row.position,
                "shift_name": row.shift_name,
                "start_time": row.start_time.isoformat(),
                "end_time": row.end_time.isoformat(),
                "tolerance_minutes": row.tolerance_minutes,
                "clock_in": row.clock_in.isoformat() if row.clock_in else None,
                "clock_out": row.clock_out.isoformat() if row.clock_out else None,
                "status": row.status or "NOT_CHECKED_IN",
                "late_minutes": row.late_minutes or 0,
                "work_minutes": row.work_minutes or 0
            })
        
        return jsonify({
            "success": True,
            "data": data,
            "total_scheduled": len(data)
        }), 200
    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500


@staff_bp.route("/attendance/<int:schedule_id>/clock-in", methods=["PATCH"])
@check_authorization("OWNER", "HRD", "KASIR")
def clock_in(user, schedule_id):
    """Clock in for a scheduled staff member"""
    try:
        now = waktu_wib()
        today = now.date()

        schedule = StaffSchedule.query.get(schedule_id)
        if not schedule or schedule.schedule_date != today:
            return jsonify({
                "success": False,
                "message": "Jadwal hari ini tidak ditemukan"
            }), 404

        attendance = Attendance.query.filter_by(schedule_id=schedule.id).first()
        if not attendance:
            attendance = Attendance(
                staff_id=schedule.staff_id,
                schedule_id=schedule.id,
                attendance_date=today,
                status="NOT_CHECKED_IN"
            )
            db.session.add(attendance)

        if attendance.clock_in:
            return jsonify({
                "success": False,
                "message": "Staff sudah clock in"
            }), 409

        shift_start = datetime.combine(today, schedule.shift.start_time)
        tolerance_limit = shift_start + timedelta(
            minutes=schedule.shift.tolerance_minutes or 0
        )

        late_minutes = 0
        status = "PRESENT"
        if now > tolerance_limit:
            late_minutes = int((now - tolerance_limit).total_seconds() // 60)
            status = "LATE"

        attendance.clock_in = now
        attendance.status = status
        attendance.late_minutes = late_minutes

        db.session.commit()

        return jsonify({
            "success": True,
            "message": "Clock in berhasil",
            "data": {
                "status": attendance.status,
                "clock_in": attendance.clock_in.isoformat(),
                "late_minutes": attendance.late_minutes
            }
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500


@staff_bp.route("/attendance/<int:schedule_id>/clock-out", methods=["PATCH"])
@check_authorization("OWNER", "HRD", "KASIR")
def clock_out(user, schedule_id):
    """Clock out for a scheduled staff member"""
    try:
        now = waktu_wib()
        today = now.date()

        schedule = StaffSchedule.query.get(schedule_id)
        if not schedule or schedule.schedule_date != today:
            return jsonify({
                "success": False,
                "message": "Jadwal hari ini tidak ditemukan"
            }), 404

        attendance = Attendance.query.filter_by(schedule_id=schedule.id).first()
        if not attendance or not attendance.clock_in:
            return jsonify({
                "success": False,
                "message": "Staff belum clock in"
            }), 409

        if attendance.clock_out:
            return jsonify({
                "success": False,
                "message": "Staff sudah clock out"
            }), 409

        if attendance.status in ["LEAVE", "SICK", "ABSENT"]:
            return jsonify({
                "success": False,
                "message": "Status kehadiran tidak dapat clock out"
            }), 409

        attendance.clock_out = now
        attendance.work_minutes = int((now - attendance.clock_in).total_seconds() // 60)
        attendance.status = "COMPLETED"

        db.session.commit()

        return jsonify({
            "success": True,
            "message": "Clock out berhasil",
            "data": {
                "status": attendance.status,
                "clock_out": attendance.clock_out.isoformat(),
                "late_minutes": attendance.late_minutes,
                "work_minutes": attendance.work_minutes
            }
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

# ====================================================
# STATISTICS
# ====================================================

@staff_bp.route("/statistics/today", methods=["GET"])
@check_authorization("OWNER", "HRD")
def get_today_statistics(user):
    """Get today's statistics"""
    try:
        today = waktu_wib().date()
        
        # Total scheduled
        total_scheduled = db.session.query(func.count(StaffSchedule.id)).filter(
            StaffSchedule.schedule_date == today
        ).scalar() or 0
        
        # Present count (PRESENT, LATE, COMPLETED)
        present_count = db.session.query(func.count(Attendance.id)).filter(
            Attendance.attendance_date == today,
            Attendance.status.in_(["PRESENT", "LATE", "COMPLETED"])
        ).scalar() or 0
        
        # Late count
        late_count = db.session.query(func.count(Attendance.id)).filter(
            Attendance.attendance_date == today,
            Attendance.late_minutes > 0
        ).scalar() or 0
        
        # Average late minutes
        avg_late = db.session.query(func.avg(Attendance.late_minutes)).filter(
            Attendance.attendance_date == today,
            Attendance.late_minutes > 0
        ).scalar() or 0
        
        # Leave/Sick count
        leave_count = db.session.query(func.count(Attendance.id)).filter(
            Attendance.attendance_date == today,
            Attendance.status.in_(["LEAVE", "SICK"])
        ).scalar() or 0
        
        # Calculate attendance rate
        attendance_rate = 0
        if total_scheduled > 0:
            attendance_rate = round((present_count / total_scheduled) * 100, 1)
        
        return jsonify({
            "success": True,
            "data": {
                "total_scheduled": total_scheduled,
                "present_count": present_count,
                "attendance_rate": attendance_rate,
                "late_count": late_count,
                "avg_late_minutes": round(avg_late, 0) if avg_late else 0,
                "leave_count": leave_count
            }
        }), 200
    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

@staff_bp.route("/statistics/month", methods=["GET"])
@check_authorization("OWNER", "HRD")
def get_month_statistics(user):
    """Get this month's statistics"""
    try:
        today = waktu_wib().date()
        month_start = date(today.year, today.month, 1)
        
        # Next month's first day
        if today.month == 12:
            month_end = date(today.year + 1, 1, 1) - timedelta(days=1)
        else:
            month_end = date(today.year, today.month + 1, 1) - timedelta(days=1)
        
        # Total scheduled in month
        total_scheduled = db.session.query(func.count(StaffSchedule.id)).filter(
            StaffSchedule.schedule_date >= month_start,
            StaffSchedule.schedule_date <= month_end
        ).scalar() or 0
        
        # Total attended (PRESENT, LATE, COMPLETED)
        total_attended = db.session.query(func.count(Attendance.id)).filter(
            Attendance.attendance_date >= month_start,
            Attendance.attendance_date <= month_end,
            Attendance.status.in_(["PRESENT", "LATE", "COMPLETED"])
        ).scalar() or 0
        
        # Total leave/sick (LEAVE, SICK)
        total_leave = db.session.query(func.count(Attendance.id)).filter(
            Attendance.attendance_date >= month_start,
            Attendance.attendance_date <= month_end,
            Attendance.status.in_(["LEAVE", "SICK"])
        ).scalar() or 0
        
        # Calculate rate
        attendance_rate = 0
        if total_scheduled > 0:
            attendance_rate = round((total_attended / total_scheduled) * 100, 1)
        
        return jsonify({
            "success": True,
            "data": {
                "total_attended": total_attended,
                "total_leave": total_leave,
                "attendance_rate": attendance_rate
            }
        }), 200
    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

# ====================================================
# LEAVE REQUEST
# ====================================================

@staff_bp.route("/leave-request", methods=["GET"])
@check_authorization("OWNER", "HRD")
def get_leave_requests(user):
    """Get pending leave requests"""
    try:
        requests = LeaveRequest.query.filter_by(status="PENDING").all()
        
        data = [{
            "id": r.id,
            "staff_id": r.staff_id,
            "staff_name": r.staff.full_name,
            "leave_type": r.leave_type,
            "start_date": r.start_date.isoformat(),
            "end_date": r.end_date.isoformat(),
            "reason": r.reason,
            "document_url": r.document_url,
            "status": r.status,
            "created_at": r.created_at.isoformat()
        } for r in requests]
        
        return jsonify({
            "success": True,
            "data": data
        }), 200
    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

@staff_bp.route("/leave-request/<int:request_id>/approve", methods=["PATCH"])
@check_authorization("OWNER", "HRD")
def approve_leave(user, request_id):
    """Approve leave request"""
    try:
        leave_req = LeaveRequest.query.get(request_id)
        if not leave_req:
            return jsonify({
                "success": False,
                "message": "Permintaan tidak ditemukan"
            }), 404

        if leave_req.status != "PENDING":
            return jsonify({
                "success": False,
                "message": "Permintaan sudah direview"
            }), 409
        
        leave_req.status = "APPROVED"
        leave_req.reviewed_by = user.id
        leave_req.reviewed_at = waktu_wib()

        attendance_status = "SICK" if leave_req.leave_type == "SICK" else "LEAVE"

        # Create/Update Attendance for each day
        current_date = leave_req.start_date
        while current_date <= leave_req.end_date:
            schedule = StaffSchedule.query.filter_by(
                staff_id=leave_req.staff_id,
                schedule_date=current_date
            ).first()
            
            if schedule:
                attendance = Attendance.query.filter_by(schedule_id=schedule.id).first()
                if not attendance:
                    attendance = Attendance(
                        staff_id=leave_req.staff_id,
                        schedule_id=schedule.id,
                        attendance_date=current_date
                    )
                    db.session.add(attendance)

                attendance.status = attendance_status
                attendance.clock_in = None
                attendance.clock_out = None
                attendance.late_minutes = 0
                attendance.work_minutes = 0
            
            current_date += timedelta(days=1)
        
        db.session.commit()
        
        return jsonify({
            "success": True,
            "message": "Permintaan berhasil disetujui"
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

@staff_bp.route("/leave-request/<int:request_id>/reject", methods=["PATCH"])
@check_authorization("OWNER", "HRD")
def reject_leave(user, request_id):
    """Reject leave request"""
    try:
        leave_req = LeaveRequest.query.get(request_id)
        if not leave_req:
            return jsonify({
                "success": False,
                "message": "Permintaan tidak ditemukan"
            }), 404

        if leave_req.status != "PENDING":
            return jsonify({
                "success": False,
                "message": "Permintaan sudah direview"
            }), 409
        
        leave_req.status = "REJECTED"
        leave_req.reviewed_by = user.id
        leave_req.reviewed_at = waktu_wib()
        db.session.commit()
        
        return jsonify({
            "success": True,
            "message": "Permintaan berhasil ditolak"
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500
