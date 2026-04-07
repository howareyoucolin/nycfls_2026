<?php
declare(strict_types=1);

require_once __DIR__ . '/_vip_admin_auth.php';
require_once dirname(__DIR__) . '/includes/vip_updates.php';

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
    if (!vip_updates_has_discard_flag($pdo)) {
        api_error('missing_schema', 'vip_updates.is_discarded is required before discarding updates.', 409);
    }

    $statement = $pdo->prepare(
        'UPDATE vip_updates
        SET is_discarded = 1
        WHERE id = :id
          AND applied_at IS NULL
          AND ' . vip_updates_discard_predicate($pdo, 'vip_updates')
    );
    $statement->execute([
        ':id' => $id,
    ]);

    if ($statement->rowCount() < 1) {
        api_error('not_found', 'Pending update not found.', 404);
    }

    api_ok([
        'id' => $id,
        'discarded' => true,
    ], 'VIP update discarded.');
} catch (Throwable $throwable) {
    api_error('server_error', 'Unable to discard this VIP update right now.', 500);
}
