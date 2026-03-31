<?php
declare(strict_types=1);

require_once __DIR__ . '/_vip_admin_auth.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    api_error('method_not_allowed', 'Only GET is allowed.', 405);
}

$claims = vip_admin_require_auth();

$id = (int) ($_GET['id'] ?? 0);
if ($id <= 0) {
    api_error('invalid_id', 'A valid signup id is required.', 422);
}

try {
    $pdo = db();

    $statement = $pdo->prepare(
        '
        SELECT
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
            v.approved_by,
            v.approved_at,
            v.created_at,
            v.updated_at,
            vm.ip_address,
            vm.ip_lookup_location,
            vm.browser_name,
            vm.browser_version,
            vm.os_name,
            vm.os_version,
            vm.device_type
        FROM vips v
        LEFT JOIN (
            SELECT latest.*
            FROM vip_meta latest
            INNER JOIN (
                SELECT vip_id, MAX(id) AS latest_id
                FROM vip_meta
                WHERE vip_id IS NOT NULL
                GROUP BY vip_id
            ) grouped ON grouped.latest_id = latest.id
        ) vm ON vm.vip_id = v.id
        WHERE v.id = :id
        LIMIT 1
        '
    );
    $statement->execute([
        ':id' => $id,
    ]);

    $item = $statement->fetch();
    if (!is_array($item)) {
        api_error('not_found', 'Signup not found.', 404);
    }

    api_ok([
        'item' => $item,
        'viewer' => [
            'user_id' => (string) ($claims['sub'] ?? ''),
            'label' => (string) ($claims['_actor_label'] ?? ''),
        ],
    ], 'Loaded VIP signup.');
} catch (Throwable $throwable) {
    api_error('server_error', 'Unable to load this VIP signup right now.', 500);
}
