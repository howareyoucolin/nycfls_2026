CREATE TABLE IF NOT EXISTS vip_updates (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    source_vip_id BIGINT UNSIGNED NOT NULL,
    nickname VARCHAR(100) NOT NULL,
    generation ENUM('70', '80', '90', '00') NOT NULL,
    gender ENUM('m', 'f') NOT NULL,
    location VARCHAR(100) NOT NULL,
    join_reason VARCHAR(50) NOT NULL,
    intro_text TEXT NOT NULL,
    contact_type ENUM('wechat', 'phone', 'email', 'qrcode') DEFAULT NULL,
    contact_info VARCHAR(255) DEFAULT NULL,
    contact_qrcode_path VARCHAR(255) DEFAULT NULL,
    is_read TINYINT(1) NOT NULL DEFAULT 0,
    is_approved TINYINT(1) NOT NULL DEFAULT 0,
    is_discarded TINYINT(1) NOT NULL DEFAULT 0,
    approved_by VARCHAR(100) DEFAULT NULL,
    approved_at DATETIME DEFAULT NULL,
    applied_at DATETIME DEFAULT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY vip_updates_source_vip_idx (source_vip_id),
    KEY vip_updates_pending_idx (is_approved, is_discarded, applied_at, is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET @vip_updates_add_is_discarded_sql = (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE vip_updates ADD COLUMN is_discarded TINYINT(1) NOT NULL DEFAULT 0 AFTER is_approved',
        'SELECT 1'
    )
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'vip_updates'
      AND COLUMN_NAME = 'is_discarded'
);

PREPARE vip_updates_add_is_discarded_stmt FROM @vip_updates_add_is_discarded_sql;
EXECUTE vip_updates_add_is_discarded_stmt;
DEALLOCATE PREPARE vip_updates_add_is_discarded_stmt;
