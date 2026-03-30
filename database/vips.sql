CREATE TABLE IF NOT EXISTS vips (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    nickname VARCHAR(100) NOT NULL,
    generation ENUM('70', '80', '90', '00') NOT NULL,
    gender ENUM('m', 'f') NOT NULL,
    location VARCHAR(100) NOT NULL,
    join_reason VARCHAR(50) NOT NULL,
    intro_text TEXT NOT NULL,
    contact_type ENUM('wechat', 'phone', 'email', 'qrcode') DEFAULT NULL,
    contact_info VARCHAR(255) DEFAULT NULL,
    contact_qrcode_path VARCHAR(255) DEFAULT NULL,
    is_approved TINYINT(1) NOT NULL DEFAULT 0,
    approved_by VARCHAR(100) DEFAULT NULL,
    approved_at DATETIME DEFAULT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
