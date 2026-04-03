<?php
declare(strict_types=1);

require_once __DIR__ . '/_vip_admin_auth.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'POST') !== 'POST') {
    api_error('method_not_allowed', 'Only POST is allowed.', 405);
}

vip_admin_require_auth();

$payload = vip_admin_request_json();
$id = (int) ($payload['id'] ?? 0);
if ($id <= 0) {
    api_error('invalid_id', 'A valid signup id is required.', 422);
}

try {
    $pdo = db();
    $statement = $pdo->prepare(
        'UPDATE vips
        SET is_deleted = 0
        WHERE id = :id AND is_deleted = 1'
    );
    $statement->execute([
        ':id' => $id,
    ]);

    if ($statement->rowCount() < 1) {
        api_error('not_found', 'Signup not found.', 404);
    }

    api_ok([
        'id' => $id,
        'restored' => true,
    ], 'VIP signup restored.');
} catch (Throwable $throwable) {
    api_error('server_error', 'Unable to restore this signup right now.', 500);
}
