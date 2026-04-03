CREATE TABLE IF NOT EXISTS vip_whitelist (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    whitelisted_email VARCHAR(255) NOT NULL,
    role ENUM('admin', 'manager') NOT NULL DEFAULT 'manager',
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET @vip_whitelist_add_role_sql = (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE vip_whitelist ADD COLUMN role ENUM(''admin'', ''manager'') NOT NULL DEFAULT ''manager'' AFTER whitelisted_email',
        'SELECT 1'
    )
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'vip_whitelist'
      AND COLUMN_NAME = 'role'
);

PREPARE vip_whitelist_add_role_stmt FROM @vip_whitelist_add_role_sql;
EXECUTE vip_whitelist_add_role_stmt;
DEALLOCATE PREPARE vip_whitelist_add_role_stmt;
