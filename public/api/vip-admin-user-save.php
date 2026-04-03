<?php
declare(strict_types=1);

require_once __DIR__ . '/_vip_admin_auth.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'POST') !== 'POST') {
    api_error('method_not_allowed', '只允许使用 POST 请求。', 405);
}

$claims = vip_admin_require_auth();
vip_admin_require_role($claims, 'admin');
$payload = vip_admin_request_json();

$email = mb_strtolower(trim((string) ($payload['email'] ?? '')));
$role = trim((string) ($payload['role'] ?? 'manager'));

if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    api_error('invalid_email', '请输入有效的邮箱地址。', 422);
}

if (!in_array($role, ['admin', 'manager'], true)) {
    api_error('invalid_role', '角色必须是 admin 或 manager。', 422);
}

try {
    $pdo = db();

    $existingStatement = $pdo->prepare(
        'SELECT id, whitelisted_email, role
        FROM vip_whitelist
        WHERE LOWER(TRIM(whitelisted_email)) = :email
        ORDER BY id ASC
        LIMIT 1'
    );
    $existingStatement->execute([
        ':email' => $email,
    ]);
    $existing = $existingStatement->fetch();

    if (is_array($existing)) {
        $existingId = (int) ($existing['id'] ?? 0);
        $existingRole = (string) ($existing['role'] ?? 'manager');

        if ($existingRole === 'admin' && $role !== 'admin') {
            $adminCount = (int) $pdo->query("SELECT COUNT(*) FROM vip_whitelist WHERE role = 'admin'")->fetchColumn();
            if ($adminCount <= 1) {
                api_error('last_admin_required', '至少需要保留一个管理员。', 422);
            }
        }

        $updateStatement = $pdo->prepare(
            'UPDATE vip_whitelist
            SET whitelisted_email = :email, role = :role
            WHERE id = :id'
        );
        $updateStatement->execute([
            ':id' => $existingId,
            ':email' => $email,
            ':role' => $role,
        ]);

        api_ok([
            'id' => $existingId,
            'email' => $email,
            'role' => $role,
            'created' => false,
        ], '用户已更新。');
    }

    $insertStatement = $pdo->prepare(
        'INSERT INTO vip_whitelist (whitelisted_email, role)
        VALUES (:email, :role)'
    );
    $insertStatement->execute([
        ':email' => $email,
        ':role' => $role,
    ]);

    api_ok([
        'id' => (int) $pdo->lastInsertId(),
        'email' => $email,
        'role' => $role,
        'created' => true,
    ], '用户已添加。');
} catch (Throwable $throwable) {
    api_error('server_error', '暂时无法保存这个用户。', 500);
}
