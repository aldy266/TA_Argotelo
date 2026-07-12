from model import Role, Staff, User, db, waktu_wib
from utils.roles import EMPLOYEE_ROLE_CODES, normalize_role, role_group, role_label


def unique_employee_code(user_id):
    base_code = f"ARG{user_id:03}"
    candidate = base_code
    suffix = 1

    while True:
        existing = Staff.query.filter_by(employee_code=candidate).first()
        if not existing or existing.user_id == user_id:
            return candidate

        suffix += 1
        candidate = f"{base_code}-{suffix}"


def ensure_staff_profile_for_user(user):
    if not user:
        return None

    role = Role.query.get(user.role_id)
    if not role:
        return None

    role_name = normalize_role(role.role_name)
    if role_name not in EMPLOYEE_ROLE_CODES:
        return None

    staff = Staff.query.filter_by(user_id=user.id).first()
    staff_data = {
        "full_name": user.fullname,
        "department": role_group(role_name),
        "position": role_label(role_name),
        "phone": user.phone,
        "email": user.email,
        "status": "ACTIVE" if user.is_active else "INACTIVE",
    }

    if staff:
        for field, value in staff_data.items():
            setattr(staff, field, value)
        return staff

    staff = Staff(
        user_id=user.id,
        employee_code=unique_employee_code(user.id),
        joined_at=waktu_wib(),
        **staff_data
    )
    db.session.add(staff)
    return staff


def ensure_staff_profiles_for_employee_users():
    users = User.query.join(Role).filter(
        Role.role_name.in_(EMPLOYEE_ROLE_CODES)
    ).all()

    for user in users:
        ensure_staff_profile_for_user(user)

    db.session.commit()
