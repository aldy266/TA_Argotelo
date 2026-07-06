from flask import Blueprint, request, jsonify, session
from datetime import datetime, timedelta, date
from sqlalchemy import func
from model import db, Staff, Shift, StaffSchedule, Attendance, LeaveRequest, User
from werkzeug.security import generate_password_hash

staff_bp = Blueprint("staff_api", __name__, url_prefix="/api/staff")

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
    
    if user.role.role_name not in roles:
        return None
    
    return user

def check_authorization(*required_roles):
    """Decorator to check authorization"""
    def decorator(f):
        def wrapper(*args, **kwargs):
            user = require_role(*required_roles)
            if not user:
                return jsonify({
                    "success": False,
                    "message": "Unauthorized"
                }), 403
            return f(user, *args, **kwargs)
        wrapper.__name__ = f.__name__
        return wrapper
    return decorator

def waktu_wib():
    """Indonesia timezone"""
    return datetime.utcnow() + timedelta(hours=7)

# ====================================================
# STAFF MANAGEMENT
# ====================================================

@staff_bp.route("", methods=["GET"])
@check_authorization("OWNER", "HRD")
def get_staff(user):
    """Get all active staff"""
    try:
        staff = Staff.query.filter_by(status="ACTIVE").all()
        
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
        today = date.today()
        
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

# ====================================================
# STATISTICS
# ====================================================

@staff_bp.route("/statistics/today", methods=["GET"])
@check_authorization("OWNER", "HRD")
def get_today_statistics(user):
    """Get today's statistics"""
    try:
        today = date.today()
        
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
        today = date.today()
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
        
        leave_req.status = "APPROVED"
        leave_req.reviewed_by = user.id
        leave_req.reviewed_at = waktu_wib()
        
        db.session.commit()
        
        # Create/Update Attendance for each day
        current_date = leave_req.start_date
        while current_date <= leave_req.end_date:
            schedule = StaffSchedule.query.filter_by(
                staff_id=leave_req.staff_id,
                schedule_date=current_date
            ).first()
            
            if schedule:
                attendance = Attendance.query.filter_by(schedule_id=schedule.id).first()
                if attendance:
                    attendance.status = leave_req.leave_type  # SICK, LEAVE, or PERMISSION
                    attendance.clock_in = None
                    attendance.clock_out = None
            
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
