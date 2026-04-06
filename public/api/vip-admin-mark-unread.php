<?php
declare(strict_types=1);

require_once __DIR__ . '/_vip_admin_auth.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'POST') !== 'POST') {
    api_error('method_not_allowed', 'Only POST is allowed.', 405);
}

$claims = vip_admin_require_auth();
$payload = vip_admin_request_json();

$id = (int) ($payload['id'] ?? 0);
if ($id <= 0) {
    api_error('invalid_id', 'A valid signup id is required.', 422);
}

try {
    $pdo = db();
    $statement = $pdo->prepare(
        'UPDATE vips
        SET is_read = 0
        WHERE id = :id
          AND is_deleted = 0'
    );
    $statement->execute([
        ':id' => $id,
    ]);

    api_ok([
        'id' => $id,
        'updated' => (int) $statement->rowCount(),
        'viewer' => [
            'user_id' => (string) ($claims['sub'] ?? ''),
            'label' => (string) ($claims['_actor_label'] ?? ''),
        ],
    ], 'Marked VIP as unread.');
} catch (Throwable $throwable) {
    api_error('server_error', 'Unable to mark this VIP as unread right now.', 500);
}
