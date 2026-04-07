<?php
declare(strict_types=1);

require dirname(__DIR__) . '/bootstrap.php';
require dirname(__DIR__) . '/includes/vip_updates.php';

header('Content-Type: application/json; charset=utf-8');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    http_response_code(405);
    echo json_encode([
        'ok' => false,
        'message' => '请求方式不正确。',
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$fingerprint = trim((string) ($_GET['fingerprint'] ?? ''));

if ($fingerprint === '') {
    echo json_encode([
        'ok' => true,
        'data' => [
            'item' => null,
        ],
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

function vip_signup_table_exists(PDO $pdo, string $tableName): bool
{
    $statement = $pdo->prepare(
        'SELECT COUNT(*)
        FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = :table_name'
    );
    $statement->execute([
        ':table_name' => $tableName,
    ]);

    return (int) $statement->fetchColumn() > 0;
}

function vip_signup_column_exists(PDO $pdo, string $tableName, string $columnName): bool
{
    $statement = $pdo->prepare(
        'SELECT COUNT(*)
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = :table_name
          AND COLUMN_NAME = :column_name'
    );
    $statement->execute([
        ':table_name' => $tableName,
        ':column_name' => $columnName,
    ]);

    return (int) $statement->fetchColumn() > 0;
}

function vip_signup_detect_browser(string $userAgent): array
{
    $patterns = [
        'Edge' => '/Edg\/([0-9\.]+)/i',
        'Opera' => '/OPR\/([0-9\.]+)/i',
        'Chrome' => '/Chrome\/([0-9\.]+)/i',
        'Firefox' => '/Firefox\/([0-9\.]+)/i',
        'Safari' => '/Version\/([0-9\.]+).*Safari/i',
    ];

    foreach ($patterns as $name => $pattern) {
        if (preg_match($pattern, $userAgent, $matches)) {
            return [$name, $matches[1] ?? ''];
        }
    }

    if (preg_match('/MSIE\s([0-9\.]+)/i', $userAgent, $matches) || preg_match('/Trident\/.*rv:([0-9\.]+)/i', $userAgent, $matches)) {
        return ['Internet Explorer', $matches[1] ?? ''];
    }

    return ['', ''];
}

function vip_signup_detect_os(string $userAgent): array
{
    $patterns = [
        'Windows' => '/Windows NT\s([0-9\.]+)/i',
        'macOS' => '/Mac OS X\s([0-9_]+)/i',
        'iOS' => '/iPhone OS\s([0-9_]+)/i',
        'Android' => '/Android\s([0-9\.]+)/i',
        'Linux' => '/Linux/i',
    ];

    foreach ($patterns as $name => $pattern) {
        if (preg_match($pattern, $userAgent, $matches)) {
            $version = $matches[1] ?? '';
            return [$name, str_replace('_', '.', $version)];
        }
    }

    return ['', ''];
}

function vip_signup_detect_device_type(string $userAgent): string
{
    $normalizedUserAgent = strtolower($userAgent);

    if ($normalizedUserAgent === '') {
        return '';
    }

    if (str_contains($normalizedUserAgent, 'ipad') || str_contains($normalizedUserAgent, 'tablet')) {
        return 'tablet';
    }

    if (
        str_contains($normalizedUserAgent, 'mobile')
        || str_contains($normalizedUserAgent, 'iphone')
        || str_contains($normalizedUserAgent, 'android')
    ) {
        return 'mobile';
    }

    return 'desktop';
}

function vip_signup_fingerprint_candidates(string $clientFingerprint): array
{
    $userAgent = trim((string) ($_SERVER['HTTP_USER_AGENT'] ?? ''));
    [$browserName, $browserVersion] = vip_signup_detect_browser($userAgent);
    [$osName, $osVersion] = vip_signup_detect_os($userAgent);

    $serverFingerprintSource = implode('|', [
        $userAgent,
        trim((string) ($_SERVER['HTTP_ACCEPT_LANGUAGE'] ?? '')),
        trim((string) ($_SERVER['HTTP_SEC_CH_UA'] ?? '')),
        trim((string) ($_SERVER['HTTP_SEC_CH_UA_PLATFORM'] ?? '')),
        trim((string) ($_SERVER['HTTP_SEC_CH_UA_MOBILE'] ?? '')),
        vip_signup_detect_device_type($userAgent),
        $browserName,
        $browserVersion,
        $osName,
        $osVersion,
    ]);

    $candidates = [];

    if ($clientFingerprint !== '') {
        $candidates[] = $clientFingerprint;
    }

    if ($serverFingerprintSource !== '') {
        $candidates[] = hash('sha256', $serverFingerprintSource);
    }

    return array_values(array_unique(array_filter($candidates, static fn (string $value): bool => $value !== '')));
}

try {
    $pdo = db();
    $fingerprintCandidates = vip_signup_fingerprint_candidates($fingerprint);

    if ($fingerprintCandidates === []) {
        echo json_encode([
            'ok' => true,
            'data' => [
                'item' => null,
            ],
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $buildFingerprintInClause = static function (string $prefix, array $candidates): array {
        $placeholders = [];
        $params = [];

        foreach (array_values($candidates) as $index => $candidate) {
            $placeholder = ':' . $prefix . '_fingerprint_' . $index;
            $placeholders[] = $placeholder;
            $params[$placeholder] = $candidate;
        }

        return [
            'sql' => implode(', ', $placeholders),
            'params' => $params,
        ];
    };

    $vipFingerprintClause = $buildFingerprintInClause('vip', $fingerprintCandidates);
    $updateFingerprintClause = $buildFingerprintInClause('update', $fingerprintCandidates);
    $hasVipUpdatesTable = vip_signup_table_exists($pdo, 'vip_updates');
    $hasVipUpdateMetaColumn = vip_signup_column_exists($pdo, 'vip_meta', 'vip_update_id');
    $updateDiscardPredicate = $hasVipUpdatesTable ? vip_updates_discard_predicate($pdo, 'vu') : '1 = 1';

    if ($hasVipUpdatesTable && $hasVipUpdateMetaColumn) {
        $statement = $pdo->prepare(
            'SELECT *
            FROM (
                SELECT
                    "vip" AS entry_type,
                    v.id,
                    NULL AS source_vip_id,
                    v.nickname,
                    v.generation,
                    v.gender,
                    v.location,
                    v.join_reason,
                    v.intro_text,
                    v.contact_type,
                    v.contact_info,
                    v.contact_qrcode_path,
                    v.is_approved,
                    v.created_at,
                    v.updated_at,
                    MAX(vm.id) AS matched_meta_id
                FROM vips v
                INNER JOIN vip_meta vm ON vm.vip_id = v.id
                WHERE vm.fingerprint IN (' . $vipFingerprintClause['sql'] . ')
                  AND v.is_deleted = 0
                GROUP BY
                    v.id,
                    v.nickname,
                    v.generation,
                    v.gender,
                    v.location,
                    v.join_reason,
                    v.intro_text,
                    v.contact_type,
                    v.contact_info,
                    v.contact_qrcode_path,
                    v.is_approved,
                    v.created_at,
                    v.updated_at

                UNION ALL

                SELECT
                    "update" AS entry_type,
                    vu.id,
                    vu.source_vip_id,
                    vu.nickname,
                    vu.generation,
                    vu.gender,
                    vu.location,
                    vu.join_reason,
                    vu.intro_text,
                    vu.contact_type,
                    vu.contact_info,
                    vu.contact_qrcode_path,
                    vu.is_approved,
                    vu.created_at,
                    vu.updated_at,
                    MAX(vum.id) AS matched_meta_id
                FROM vip_updates vu
                INNER JOIN vip_meta vum ON vum.vip_update_id = vu.id
                WHERE vum.fingerprint IN (' . $updateFingerprintClause['sql'] . ')
                  AND vu.applied_at IS NULL
                  AND ' . $updateDiscardPredicate . '
                GROUP BY
                    vu.id,
                    vu.source_vip_id,
                    vu.nickname,
                    vu.generation,
                    vu.gender,
                    vu.location,
                    vu.join_reason,
                    vu.intro_text,
                    vu.contact_type,
                    vu.contact_info,
                    vu.contact_qrcode_path,
                    vu.is_approved,
                    vu.created_at,
                    vu.updated_at
            ) entries
            ORDER BY matched_meta_id DESC, updated_at DESC, created_at DESC, id DESC
            LIMIT 1'
        );
        $queryParams = array_merge($vipFingerprintClause['params'], $updateFingerprintClause['params']);
    } else {
        $statement = $pdo->prepare(
            'SELECT
                "vip" AS entry_type,
                v.id,
                NULL AS source_vip_id,
                v.nickname,
                v.generation,
                v.gender,
                v.location,
                v.join_reason,
                v.intro_text,
                v.contact_type,
                v.contact_info,
                v.contact_qrcode_path,
                v.is_approved,
                v.created_at,
                v.updated_at,
                MAX(vm.id) AS matched_meta_id
            FROM vips v
            INNER JOIN vip_meta vm ON vm.vip_id = v.id
            WHERE vm.fingerprint IN (' . $vipFingerprintClause['sql'] . ')
              AND v.is_deleted = 0
            GROUP BY
                v.id,
                v.nickname,
                v.generation,
                v.gender,
                v.location,
                v.join_reason,
                v.intro_text,
                v.contact_type,
                v.contact_info,
                v.contact_qrcode_path,
                v.is_approved,
                v.created_at,
                v.updated_at
            ORDER BY matched_meta_id DESC, v.updated_at DESC, v.created_at DESC, v.id DESC
            LIMIT 1'
        );
        $queryParams = $vipFingerprintClause['params'];
    }

    $statement->execute($queryParams);

    $item = $statement->fetch();

    echo json_encode([
        'ok' => true,
        'data' => [
            'item' => is_array($item) ? $item : null,
        ],
    ], JSON_UNESCAPED_UNICODE);
} catch (Throwable $exception) {
    error_log('vip-signup-profile lookup failed: ' . $exception->getMessage());

    echo json_encode([
        'ok' => true,
        'data' => [
            'item' => null,
        ],
    ], JSON_UNESCAPED_UNICODE);
}
