ORG_ROLES = [
    ("OWNER", "Owner & Agency Service", "Manajemen"),
    ("FINANCE", "Finance", "Keuangan"),
    ("TIM_FINANCE", "Tim Finance", "Keuangan"),
    ("QC", "QC", "Quality Control"),
    ("TRAINER_BD", "Trainer & Business Development", "Trainer & BD"),
    ("TIM_TRAINER_BD", "Tim Trainer & BD", "Trainer & BD"),
    ("GUDANG_PENGIRIMAN", "Gudang dan Pengiriman", "Gudang"),
    ("TIM_GUDANG", "Tim Gudang", "Gudang"),
    ("KOORDINATOR_TOKO", "Koordinator Toko", "Toko"),
    ("TIM_TOKO", "Tim Toko", "Toko"),
    ("KOORDINATOR_PRODUKSI", "Koordinator Produksi", "Produksi"),
    ("TIM_PRODUKSI", "Tim Produksi", "Produksi"),
    ("KOOR_IPAL_BAHAN_BAKU", "Koor IPAL & Bahan Baku", "IPAL & Bahan Baku"),
    ("TIM_IPAL_BAHAN_BAKU", "Tim IPAL & Bahan Baku", "IPAL & Bahan Baku"),
    ("KOOR_PRODUK_OLAHAN", "Koor Produk Olahan", "Produk Olahan"),
    ("TIM_PRODUK_OLAHAN", "Tim Produk Olahan", "Produk Olahan"),
]

ROLE_LABELS = {code: label for code, label, _group in ORG_ROLES}
ROLE_GROUPS = {code: group for code, _label, group in ORG_ROLES}
ROLE_ORDER = {code: index for index, (code, _label, _group) in enumerate(ORG_ROLES)}
ROLE_GROUP_ORDER = {
    "Keuangan": 1,
    "Quality Control": 2,
    "Trainer & BD": 3,
    "Gudang": 4,
    "Toko": 5,
    "Produksi": 6,
    "IPAL & Bahan Baku": 7,
    "Produk Olahan": 8,
}

FINANCE_ROLE_CODES = {"FINANCE", "TIM_FINANCE"}
OWNER_ROLE_CODES = {"OWNER"}
STORE_ROLE_CODES = {"KASIR", "KOORDINATOR_TOKO", "TIM_TOKO"}
OPERATIONAL_ROLE_CODES = {
    "KASIR",
    "QC",
    "TRAINER_BD",
    "TIM_TRAINER_BD",
    "GUDANG_PENGIRIMAN",
    "TIM_GUDANG",
    "KOORDINATOR_TOKO",
    "TIM_TOKO",
    "KOORDINATOR_PRODUKSI",
    "TIM_PRODUKSI",
    "KOOR_IPAL_BAHAN_BAKU",
    "TIM_IPAL_BAHAN_BAKU",
    "KOOR_PRODUK_OLAHAN",
    "TIM_PRODUK_OLAHAN",
}
HRD_ROLE_CODES = {"HRD", "TRAINER_BD", "TIM_TRAINER_BD"}
EMPLOYEE_ROLE_CODES = FINANCE_ROLE_CODES | OPERATIONAL_ROLE_CODES | HRD_ROLE_CODES


def normalize_role(role_name):
    return str(role_name or "").strip().upper()


def role_label(role_name):
    role = normalize_role(role_name)
    if role == "KASIR":
        return "Tim Toko"
    if role == "HRD":
        return "Trainer & Business Development"
    return ROLE_LABELS.get(role, role.replace("_", " ").title() if role else "-")


def role_group(role_name):
    role = normalize_role(role_name)
    if role == "KASIR":
        return "Toko"
    if role == "HRD":
        return "Trainer & BD"
    return ROLE_GROUPS.get(role, "Operasional")


def role_form_code(role_name):
    role = normalize_role(role_name)
    if role == "KASIR":
        return "TIM_TOKO"
    if role == "HRD":
        return "TRAINER_BD"
    return role


def role_sort_key(role_name):
    role = normalize_role(role_name)
    group = role_group(role)
    return (ROLE_GROUP_ORDER.get(group, 99), ROLE_ORDER.get(role, 999), role_label(role))


def expand_role_names(role_names):
    expanded = set()
    for role_name in role_names:
        role = normalize_role(role_name)
        expanded.add(role)
        if role == "FINANCE":
            expanded.update(FINANCE_ROLE_CODES)
        elif role in {"KASIR", "CASHIER"}:
            expanded.update(STORE_ROLE_CODES)
        elif role in {"EMPLOYEE", "STAFF", "KARYAWAN"}:
            expanded.update(EMPLOYEE_ROLE_CODES)
        elif role == "HRD":
            expanded.update(HRD_ROLE_CODES)
        elif role == "OWNER":
            expanded.update(OWNER_ROLE_CODES)
    return expanded


def login_destination(role_name):
    role = normalize_role(role_name)
    if role in OWNER_ROLE_CODES or role in FINANCE_ROLE_CODES:
        return "/owner/dashboard"
    if role in STORE_ROLE_CODES:
        return "/cashier/pos"
    if role in OPERATIONAL_ROLE_CODES or role in HRD_ROLE_CODES:
        return "/attendance"
    return "/"
