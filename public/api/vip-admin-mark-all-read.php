<?php
declare(strict_types=1);

require_once __DIR__ . '/_vip_admin_auth.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'POST') !== 'POST') {
    api_error('method_not_allowed', 'Only POST is allowed.', 405);
}

$claims = vip_admin_require_auth();

try {
    $pdo = db();
    $statement = $pdo->prepare(
        'UPDATE vips
        SET is_read = 1
        WHERE is_deleted = 0
          AND is_read = 0'
    );
    $statement->execute();

    api_ok([
        'updated' => (int) $statement->rowCount(),
        'viewer' => [
            'user_id' => (string) ($claims['sub'] ?? ''),
            'label' => (string) ($claims['_actor_label'] ?? ''),
        ],
    ], 'Marked all unread VIPs as read.');
} catch (Throwable $throwable) {
    api_error('server_error', 'Unable to update unread VIPs right now.', 500);
}
