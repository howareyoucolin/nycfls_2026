<?php
declare(strict_types=1);

require_once __DIR__ . '/_vip_admin_auth.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    api_error('method_not_allowed', '只允许使用 GET 请求。', 405);
}

$claims = vip_admin_require_auth();
vip_admin_require_role($claims, 'admin');

try {
    $pdo = db();
    $statement = $pdo->query(
        'SELECT id, whitelisted_email, role
        FROM vip_whitelist
        ORDER BY LOWER(TRIM(whitelisted_email)) ASC, id ASC'
    );
    $items = $statement->fetchAll();

    api_ok([
        'items' => $items,
        'viewer' => [
            'user_id' => (string) ($claims['sub'] ?? ''),
            'label' => (string) ($claims['_actor_label'] ?? ''),
            'email' => (string) ($claims['_viewer_email'] ?? ''),
            'role' => (string) ($claims['_viewer_role'] ?? ''),
        ],
    ], '已加载管理员用户列表。');
} catch (Throwable $throwable) {
    api_error('server_error', '暂时无法加载用户列表。', 500);
}
