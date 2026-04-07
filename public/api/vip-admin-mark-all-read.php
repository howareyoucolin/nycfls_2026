<?php
declare(strict_types=1);

require_once __DIR__ . '/_vip_admin_auth.php';
require_once dirname(__DIR__) . '/includes/vip_updates.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'POST') !== 'POST') {
    api_error('method_not_allowed', 'Only POST is allowed.', 405);
}

$claims = vip_admin_require_auth();
$payload = vip_admin_request_json();
$scope = trim((string) ($payload['scope'] ?? 'all'));
if (!in_array($scope, ['all', 'unread', 'pending_updates'], true)) {
    $scope = 'all';
}

try {
    $pdo = db();
    $vipUpdatedCount = 0;
    $updateUpdatedCount = 0;

    if ($scope === 'all' || $scope === 'unread') {
        $vipStatement = $pdo->prepare(
            'UPDATE vips
            SET is_read = 1
            WHERE is_deleted = 0
              AND is_read = 0'
        );
        $vipStatement->execute();
        $vipUpdatedCount = (int) $vipStatement->rowCount();
    }

    if ($scope === 'all' || $scope === 'pending_updates') {
        $updateStatement = $pdo->prepare(
            'UPDATE vip_updates
            SET is_read = 1
            WHERE applied_at IS NULL
              AND ' . vip_updates_discard_predicate($pdo, 'vip_updates') . '
              AND is_read = 0'
        );
        $updateStatement->execute();
        $updateUpdatedCount = (int) $updateStatement->rowCount();
    }

    api_ok([
        'updated' => $vipUpdatedCount + $updateUpdatedCount,
        'scope' => $scope,
        'viewer' => [
            'user_id' => (string) ($claims['sub'] ?? ''),
            'label' => (string) ($claims['_actor_label'] ?? ''),
        ],
    ], 'Marked all unread VIPs as read.');
} catch (Throwable $throwable) {
    api_error('server_error', 'Unable to update unread VIPs right now.', 500);
}
