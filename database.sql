-- Active: 1782482181680@@gateway01.ap-southeast-1.prod.aws.tidbcloud.com@4000@db_argotelo
CREATE DATABASE db_argotelo;

USE db_argotelo;

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
    CONSTRAINT fk_role FOREIGN KEY (role_id) REFERENCES roles (id)
);

INSERT INTO
    roles (role_name, description)
VALUES ('OWNER', 'Pemilik Sistem'),
    ('FINANCE', 'Bagian Keuangan'),
    ('KASIR', 'Kasir / Tim Toko');

INSERT INTO
    users (
        role_id,
        fullname,
        username,
        password,
        email,
        phone
    )
VALUES (
        1,
        'Owner Argotelo',
        'owner',
        'owner123',
        'owner@argotelo.com',
        '081234567890'
    );

SELECT * FROM users;

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

CREATE TABLE IF NOT EXISTS staff_schedules (
    id INT PRIMARY KEY AUTO_INCREMENT,
    staff_id INT NOT NULL,
    shift_id INT NOT NULL,
    schedule_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_schedule_staff FOREIGN KEY (staff_id) REFERENCES staff (id) ON DELETE CASCADE,
    CONSTRAINT fk_schedule_shift FOREIGN KEY (shift_id) REFERENCES shifts (id) ON DELETE CASCADE,
    UNIQUE KEY uq_staff_schedule_date (staff_id, schedule_date),
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