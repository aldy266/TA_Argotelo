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

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_role
        FOREIGN KEY(role_id)
        REFERENCES roles(id)
);


INSERT INTO roles(role_name, description)
VALUES
('OWNER','Pemilik Sistem'),
('FINANCE','Bagian Keuangan'),
('KASIR','Kasir / Tim Toko');


INSERT INTO users
(role_id, fullname, username, password, email, phone)
VALUES
(
    1,
    'Owner Argotelo',
    'owner',
    'owner123',
    'owner@argotelo.com',
    '081234567890'
);

SELECT * FROM users;