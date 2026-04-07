<?php
declare(strict_types=1);

function vip_updates_column_exists(PDO $pdo, string $columnName): bool
{
    static $cache = [];

    $cacheKey = spl_object_id($pdo) . ':' . $columnName;
    if (array_key_exists($cacheKey, $cache)) {
        return $cache[$cacheKey];
    }

    $statement = $pdo->prepare(
        'SELECT COUNT(*)
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = :table_name
          AND COLUMN_NAME = :column_name'
    );
    $statement->execute([
        ':table_name' => 'vip_updates',
        ':column_name' => $columnName,
    ]);

    $cache[$cacheKey] = (int) $statement->fetchColumn() > 0;
    return $cache[$cacheKey];
}

function vip_updates_has_discard_flag(PDO $pdo): bool
{
    return vip_updates_column_exists($pdo, 'is_discarded');
}

function vip_updates_discard_predicate(PDO $pdo, string $alias = 'vu'): string
{
    if (!vip_updates_has_discard_flag($pdo)) {
        return '1 = 1';
    }

    return sprintf('COALESCE(%s.is_discarded, 0) = 0', $alias);
}

function vip_updates_discard_select_sql(PDO $pdo, string $alias = 'vu'): string
{
    if (!vip_updates_has_discard_flag($pdo)) {
        return '0 AS is_discarded';
    }

    return sprintf('COALESCE(%s.is_discarded, 0) AS is_discarded', $alias);
}
