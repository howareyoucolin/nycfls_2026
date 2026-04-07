<?php
declare(strict_types=1);

require_once __DIR__ . '/_vip_admin_auth.php';
require_once dirname(__DIR__) . '/includes/vip_updates.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    api_error('method_not_allowed', 'Only GET is allowed.', 405);
}

$claims = vip_admin_require_auth();

try {
    $pdo = db();
    $vipUnreadCount = (int) $pdo->query('SELECT COUNT(*) FROM vips WHERE is_deleted = 0 AND is_read = 0')->fetchColumn();
    $updateUnreadCount = (int) $pdo->query('SELECT COUNT(*) FROM vip_updates WHERE applied_at IS NULL AND ' . vip_updates_discard_predicate($pdo, 'vip_updates') . ' AND is_read = 0')->fetchColumn();
    $unreadCount = $vipUnreadCount + $updateUnreadCount;

    api_ok([
        'unread_count' => $unreadCount,
        'viewer' => [
            'user_id' => (string) ($claims['sub'] ?? ''),
            'label' => (string) ($claims['_actor_label'] ?? ''),
            'email' => (string) ($claims['_viewer_email'] ?? ''),
            'role' => (string) ($claims['_viewer_role'] ?? ''),
        ],
    ], 'Loaded unread VIP count.');
} catch (Throwable $throwable) {
    api_error('server_error', 'Unable to load unread VIP count right now.', 500);
}
