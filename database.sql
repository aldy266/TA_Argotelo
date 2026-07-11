-- Active: 1782482181680@@gateway01.ap-southeast-1.prod.aws.tidbcloud.com@4000@db_argotelo
CREATE DATABASE Argotelo;

USER Argotelo;

CREATE TABLE roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    role_name VARCHAR(30) NOT NULL UNIQUE,
    description VARCHAR(100)
);

CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    role_id INT NOT NULL,
    fullname VARCHAR(100) NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    photo VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    reset_token VARCHAR(255),
    reset_expired DATETIME,
    CONSTRAINT fk_role FOREIGN KEY (role_id) REFERENCES roles (id)
);

INSERT INTO
    roles (role_name, description)
VALUES ('OWNER', 'Pemilik Sistem'),
    ('FINANCE', 'Bagian Keuangan'),
    ('KASIR', 'Kasir / Tim Toko'),
    ('HRD', 'Human Resource');

-- Buat akun owner melalui halaman /register-owner agar password tersimpan sebagai hash.

-- ==========================================
-- STAFF MANAGEMENT TABLES
-- ==========================================

CREATE TABLE IF NOT EXISTS staff (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    employee_code VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL,
    position VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    joined_at TIMESTAMP NOT NULL,
    status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_staff_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL,
    INDEX idx_employee_code (employee_code),
    INDEX idx_status (status)
);

CREATE TABLE IF NOT EXISTS shifts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    shift_name VARCHAR(100) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    tolerance_minutes INT DEFAULT 10,
    status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO shifts (shift_name, start_time, end_time, tolerance_minutes, status)
SELECT 'Morning Shift', '07:00:00', '15:00:00', 10, 'ACTIVE'
WHERE NOT EXISTS (
    SELECT 1 FROM shifts WHERE shift_name = 'Morning Shift'
);

INSERT INTO shifts (shift_name, start_time, end_time, tolerance_minutes, status)
SELECT 'Evening Shift', '15:00:00', '23:00:00', 10, 'ACTIVE'
WHERE NOT EXISTS (
    SELECT 1 FROM shifts WHERE shift_name = 'Evening Shift'
);

CREATE TABLE IF NOT EXISTS staff_schedules (
    id INT PRIMARY KEY AUTO_INCREMENT,
    staff_id INT NOT NULL,
    shift_id INT NOT NULL,
    schedule_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_schedule_staff FOREIGN KEY (staff_id) REFERENCES staff (id) ON DELETE CASCADE,
    CONSTRAINT fk_schedule_shift FOREIGN KEY (shift_id) REFERENCES shifts (id) ON DELETE CASCADE,
    INDEX idx_schedule_staff_date (staff_id, schedule_date),
    INDEX idx_schedule_date (schedule_date)
);

CREATE TABLE IF NOT EXISTS attendance (
    id INT PRIMARY KEY AUTO_INCREMENT,
    staff_id INT NOT NULL,
    schedule_id INT NOT NULL,
    attendance_date DATE NOT NULL,
    clock_in DATETIME,
    clock_out DATETIME,
    status ENUM(
        'NOT_CHECKED_IN',
        'PRESENT',
        'LATE',
        'LEAVE',
        'SICK',
        'ABSENT',
        'COMPLETED'
    ) DEFAULT 'NOT_CHECKED_IN',
    late_minutes INT DEFAULT 0,
    work_minutes INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_attendance_staff FOREIGN KEY (staff_id) REFERENCES staff (id) ON DELETE CASCADE,
    CONSTRAINT fk_attendance_schedule FOREIGN KEY (schedule_id) REFERENCES staff_schedules (id) ON DELETE CASCADE,
    INDEX idx_attendance_date (attendance_date),
    INDEX idx_attendance_staff (staff_id)
);

CREATE TABLE IF NOT EXISTS leave_requests (
    id INT PRIMARY KEY AUTO_INCREMENT,
    staff_id INT NOT NULL,
    leave_type ENUM('SICK', 'LEAVE', 'PERMISSION') NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    document_url TEXT,
    status ENUM(
        'PENDING',
        'APPROVED',
        'REJECTED'
    ) DEFAULT 'PENDING',
    reviewed_by INT,
    reviewed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_leave_staff FOREIGN KEY (staff_id) REFERENCES staff (id) ON DELETE CASCADE,
    CONSTRAINT fk_leave_reviewer FOREIGN KEY (reviewed_by) REFERENCES users (id) ON DELETE SET NULL,
    INDEX idx_leave_status (status),
    INDEX idx_leave_staff (staff_id)
);

-- ==========================================
-- INVENTORY AND PURCHASE ORDER
-- ==========================================

CREATE TABLE IF NOT EXISTS inventory (
    id_inventory INT PRIMARY KEY AUTO_INCREMENT,
    nama_bahan VARCHAR(100) NOT NULL,
    stok DECIMAL(10, 2) NOT NULL,
    satuan VARCHAR(30) NOT NULL,
    minimal_stok DECIMAL(10, 2) NOT NULL,
    supplier VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS purchase_orders (
    id_po INT PRIMARY KEY AUTO_INCREMENT,
    id_inventory INT NOT NULL,
    jumlah_order DECIMAL(10, 2) NOT NULL,
    supplier VARCHAR(100),
    status ENUM('PENDING', 'DIKIRIM', 'SELESAI') DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_po_inventory FOREIGN KEY (id_inventory) REFERENCES inventory (id_inventory)
);

CREATE TABLE IF NOT EXISTS stock_movements (
    id INT PRIMARY KEY AUTO_INCREMENT,
    id_inventory INT NOT NULL,
    movement_type ENUM('IN', 'OUT') NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL,
    reference_type VARCHAR(50),
    reference_id INT,
    notes VARCHAR(255),
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_stock_movement_inventory FOREIGN KEY (id_inventory) REFERENCES inventory (id_inventory),
    CONSTRAINT fk_stock_movement_user FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL
);

-- ==========================================
-- MENU AND TRANSACTIONS
-- ==========================================

CREATE TABLE IF NOT EXISTS menu_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(120) NOT NULL,
    category VARCHAR(80) NOT NULL,
    price DECIMAL(12, 2) NOT NULL,
    image_url TEXT,
    status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_menu_status (status),
    INDEX idx_menu_category (category)
);

CREATE TABLE IF NOT EXISTS menu_recipes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    menu_item_id INT NOT NULL,
    id_inventory INT NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_menu_recipe_menu FOREIGN KEY (menu_item_id) REFERENCES menu_items (id) ON DELETE CASCADE,
    CONSTRAINT fk_menu_recipe_inventory FOREIGN KEY (id_inventory) REFERENCES inventory (id_inventory),
    CONSTRAINT uq_menu_recipe_inventory UNIQUE (menu_item_id, id_inventory)
);

CREATE TABLE IF NOT EXISTS transactions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    transaction_number VARCHAR(50) NOT NULL UNIQUE,
    cashier_id INT,
    customer_name VARCHAR(100) DEFAULT 'Umum',
    subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0,
    tax DECIMAL(12, 2) NOT NULL DEFAULT 0,
    total DECIMAL(12, 2) NOT NULL DEFAULT 0,
    payment_method VARCHAR(40) NOT NULL,
    cash_received DECIMAL(12, 2) NULL,
    cash_change DECIMAL(12, 2) NULL,
    status ENUM('COMPLETED', 'CANCELLED') DEFAULT 'COMPLETED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_transaction_cashier FOREIGN KEY (cashier_id) REFERENCES users (id) ON DELETE SET NULL,
    INDEX idx_transaction_created_at (created_at),
    INDEX idx_transaction_status (status)
);

CREATE TABLE IF NOT EXISTS transaction_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    transaction_id INT NOT NULL,
    menu_item_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(12, 2) NOT NULL,
    subtotal DECIMAL(12, 2) NOT NULL,
    CONSTRAINT fk_transaction_item_transaction FOREIGN KEY (transaction_id) REFERENCES transactions (id) ON DELETE CASCADE,
    CONSTRAINT fk_transaction_item_menu FOREIGN KEY (menu_item_id) REFERENCES menu_items (id)
);
