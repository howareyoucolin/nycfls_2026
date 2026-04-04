<?php
declare(strict_types=1);

require_once __DIR__ . '/_vip_admin_auth.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    api_error('method_not_allowed', 'Only GET is allowed.', 405);
}

$claims = vip_admin_require_auth();

$id = (int) ($_GET['id'] ?? 0);
if ($id <= 0) {
    api_error('invalid_id', 'A valid signup id is required.', 422);
}

try {
    $pdo = db();

    $markReadStatement = $pdo->prepare(
        'UPDATE vips
        SET is_read = 1
        WHERE id = :id AND is_deleted = 0'
    );
    $markReadStatement->execute([
        ':id' => $id,
    ]);

    $statement = $pdo->prepare(
        '
        SELECT
            v.id,
            v.nickname,
            v.generation,
            v.gender,
            v.location,
            v.join_reason,
            v.intro_text,
            v.contact_type,
            v.contact_info,
            v.contact_qrcode_path,
            v.is_deleted,
            v.is_read,
            v.is_approved,
            v.approved_by,
            v.approved_at,
            v.created_at,
            v.updated_at,
            vm.ip_address,
            vm.ip_lookup_location,
            vm.browser_name,
            vm.browser_version,
            vm.os_name,
            vm.os_version,
            vm.device_type,
            vm.fingerprint,
            COALESCE(fp.same_fingerprint_count, 0) AS same_fingerprint_count
        FROM vips v
        LEFT JOIN (
            SELECT latest.*
            FROM vip_meta latest
            INNER JOIN (
                SELECT vip_id, MAX(id) AS latest_id
                FROM vip_meta
                WHERE vip_id IS NOT NULL
                GROUP BY vip_id
            ) grouped ON grouped.latest_id = latest.id
        ) vm ON vm.vip_id = v.id
        LEFT JOIN (
            SELECT latest_meta.fingerprint, COUNT(*) AS same_fingerprint_count
            FROM vip_meta latest_meta
            INNER JOIN (
                SELECT vip_id, MAX(id) AS latest_id
                FROM vip_meta
                WHERE vip_id IS NOT NULL
                GROUP BY vip_id
            ) latest_grouped ON latest_grouped.latest_id = latest_meta.id
            WHERE latest_meta.fingerprint IS NOT NULL
              AND latest_meta.fingerprint <> ""
            GROUP BY latest_meta.fingerprint
        ) fp ON fp.fingerprint = vm.fingerprint
        WHERE v.id = :id
        LIMIT 1
        '
    );
    $statement->execute([
        ':id' => $id,
    ]);

    $item = $statement->fetch();
    if (!is_array($item)) {
        api_error('not_found', 'Signup not found.', 404);
    }

    $sameFingerprintMembers = [];
    $fingerprint = trim((string) ($item['fingerprint'] ?? ''));

    if ($fingerprint !== '') {
        $relatedStatement = $pdo->prepare(
            '
            SELECT
                v.id,
                v.nickname,
                v.is_deleted
            FROM vips v
            INNER JOIN (
                SELECT latest_meta.vip_id, latest_meta.fingerprint
                FROM vip_meta latest_meta
                INNER JOIN (
                    SELECT vip_id, MAX(id) AS latest_id
                    FROM vip_meta
                    WHERE vip_id IS NOT NULL
                    GROUP BY vip_id
                ) grouped ON grouped.latest_id = latest_meta.id
            ) latest_vm ON latest_vm.vip_id = v.id
            WHERE latest_vm.fingerprint = :fingerprint
              AND v.id <> :id
            ORDER BY v.id DESC
            '
        );
        $relatedStatement->execute([
            ':fingerprint' => $fingerprint,
            ':id' => $id,
        ]);
        $sameFingerprintMembers = $relatedStatement->fetchAll();
    }

    api_ok([
        'item' => $item,
        'same_fingerprint_members' => $sameFingerprintMembers,
        'viewer' => [
            'user_id' => (string) ($claims['sub'] ?? ''),
            'label' => (string) ($claims['_actor_label'] ?? ''),
            'email' => (string) ($claims['_viewer_email'] ?? ''),
            'role' => (string) ($claims['_viewer_role'] ?? ''),
        ],
    ], 'Loaded VIP signup.');
} catch (Throwable $throwable) {
    api_error('server_error', 'Unable to load this VIP signup right now.', 500);
}
