<?php
declare(strict_types=1);

require_once __DIR__ . '/_vip_admin_auth.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    api_error('method_not_allowed', 'Only GET is allowed.', 405);
}

$claims = vip_admin_require_auth();

api_ok([
    'allowed' => true,
    'viewer' => [
        'user_id' => (string) ($claims['sub'] ?? ''),
        'label' => (string) ($claims['_actor_label'] ?? ''),
    ],
], 'VIP admin access granted.');
