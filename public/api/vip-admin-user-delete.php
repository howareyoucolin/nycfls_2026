<?php
declare(strict_types=1);

require_once __DIR__ . '/_vip_admin_auth.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'POST') !== 'POST') {
    api_error('method_not_allowed', '只允许使用 POST 请求。', 405);
}

$claims = vip_admin_require_auth();
vip_admin_require_role($claims, 'admin');
$payload = vip_admin_request_json();

$id = (int) ($payload['id'] ?? 0);
if ($id <= 0) {
    api_error('invalid_id', '需要提供有效的用户 ID。', 422);
}

try {
    $pdo = db();

    $existingStatement = $pdo->prepare(
        'SELECT id, whitelisted_email, role
        FROM vip_whitelist
        WHERE id = :id
        LIMIT 1'
    );
    $existingStatement->execute([
        ':id' => $id,
    ]);
    $existing = $existingStatement->fetch();

    if (!is_array($existing)) {
        api_error('not_found', '未找到该用户。', 404);
    }

    if ((string) ($existing['role'] ?? '') === 'admin') {
        $adminCount = (int) $pdo->query("SELECT COUNT(*) FROM vip_whitelist WHERE role = 'admin'")->fetchColumn();
        if ($adminCount <= 1) {
            api_error('last_admin_required', '至少需要保留一个管理员。', 422);
        }
    }

    $deleteStatement = $pdo->prepare('DELETE FROM vip_whitelist WHERE id = :id');
    $deleteStatement->execute([
        ':id' => $id,
    ]);

    api_ok([
        'id' => $id,
        'deleted' => true,
    ], '用户已移除。');
} catch (Throwable $throwable) {
    api_error('server_error', '暂时无法移除这个用户。', 500);
}
