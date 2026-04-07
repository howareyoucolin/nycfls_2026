CREATE TABLE IF NOT EXISTS vip_meta (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    vip_id BIGINT UNSIGNED DEFAULT NULL,
    vip_update_id BIGINT UNSIGNED DEFAULT NULL,
    ip_address VARCHAR(45) DEFAULT NULL,
    forwarded_for VARCHAR(255) DEFAULT NULL,
    user_agent TEXT DEFAULT NULL,
    referer_url TEXT DEFAULT NULL,
    browser_name VARCHAR(100) DEFAULT NULL,
    browser_version VARCHAR(50) DEFAULT NULL,
    os_name VARCHAR(100) DEFAULT NULL,
    os_version VARCHAR(50) DEFAULT NULL,
    device_type VARCHAR(50) DEFAULT NULL,
    fingerprint VARCHAR(64) DEFAULT NULL,
    ip_lookup_location VARCHAR(255) DEFAULT NULL,
    extra_payload JSON DEFAULT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET @vip_meta_drop_sql = (
    SELECT IF(
        COUNT(*) = 0,
        'SELECT 1',
        CONCAT(
            'ALTER TABLE vip_meta ',
            GROUP_CONCAT(CONCAT('DROP COLUMN `', COLUMN_NAME, '`') ORDER BY COLUMN_NAME SEPARATOR ', ')
        )
    )
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'vip_meta'
      AND COLUMN_NAME IN (
          'request_method',
          'request_path',
          'query_string',
          'origin_url',
          'host_name',
          'accept_language'
      )
);

PREPARE vip_meta_drop_stmt FROM @vip_meta_drop_sql;
EXECUTE vip_meta_drop_stmt;
DEALLOCATE PREPARE vip_meta_drop_stmt;

SET @vip_meta_add_fingerprint_sql = (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE vip_meta ADD COLUMN fingerprint VARCHAR(64) DEFAULT NULL AFTER device_type',
        'SELECT 1'
    )
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'vip_meta'
      AND COLUMN_NAME = 'fingerprint'
);

PREPARE vip_meta_add_fingerprint_stmt FROM @vip_meta_add_fingerprint_sql;
EXECUTE vip_meta_add_fingerprint_stmt;
DEALLOCATE PREPARE vip_meta_add_fingerprint_stmt;

SET @vip_meta_add_vip_update_id_sql = (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE vip_meta ADD COLUMN vip_update_id BIGINT UNSIGNED DEFAULT NULL AFTER vip_id',
        'SELECT 1'
    )
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'vip_meta'
      AND COLUMN_NAME = 'vip_update_id'
);

PREPARE vip_meta_add_vip_update_id_stmt FROM @vip_meta_add_vip_update_id_sql;
EXECUTE vip_meta_add_vip_update_id_stmt;
DEALLOCATE PREPARE vip_meta_add_vip_update_id_stmt;
