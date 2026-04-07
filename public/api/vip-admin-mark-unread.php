<?php
declare(strict_types=1);

require_once __DIR__ . '/_vip_admin_auth.php';
require_once dirname(__DIR__) . '/includes/vip_updates.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'POST') !== 'POST') {
    api_error('method_not_allowed', 'Only POST is allowed.', 405);
}

$claims = vip_admin_require_auth();
$payload = vip_admin_request_json();

$id = (int) ($payload['id'] ?? 0);
$entryType = trim((string) ($payload['entry_type'] ?? 'vip'));
if ($id <= 0) {
    api_error('invalid_id', 'A valid signup id is required.', 422);
}

if (!in_array($entryType, ['vip', 'update'], true)) {
    $entryType = 'vip';
}

try {
    $pdo = db();
    if ($entryType === 'update') {
        $updateDiscardPredicate = vip_updates_discard_predicate($pdo, 'vip_updates');
        $statement = $pdo->prepare(
            'UPDATE vip_updates
            SET is_read = 0
            WHERE id = :id
              AND applied_at IS NULL
              AND ' . $updateDiscardPredicate
        );
    } else {
        $statement = $pdo->prepare(
            'UPDATE vips
            SET is_read = 0
            WHERE id = :id
              AND is_deleted = 0'
        );
    }
    $statement->execute([
        ':id' => $id,
    ]);

    api_ok([
        'id' => $id,
        'entry_type' => $entryType,
        'updated' => (int) $statement->rowCount(),
        'viewer' => [
            'user_id' => (string) ($claims['sub'] ?? ''),
            'label' => (string) ($claims['_actor_label'] ?? ''),
        ],
    ], 'Marked VIP as unread.');
} catch (Throwable $throwable) {
    api_error('server_error', 'Unable to mark this VIP as unread right now.', 500);
}
