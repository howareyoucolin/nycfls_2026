<?php
declare(strict_types=1);

require_once __DIR__ . '/_vip_admin_auth.php';
require_once dirname(__DIR__) . '/includes/vip_updates.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    api_error('method_not_allowed', 'Only GET is allowed.', 405);
}

$claims = vip_admin_require_auth();

$id = (int) ($_GET['id'] ?? 0);
$entryType = trim((string) ($_GET['entry'] ?? 'vip'));
if ($id <= 0) {
    api_error('invalid_id', 'A valid signup id is required.', 422);
}

if (!in_array($entryType, ['vip', 'update'], true)) {
    $entryType = 'vip';
}

try {
    $pdo = db();
    $updateDiscardPredicate = vip_updates_discard_predicate($pdo, 'vu');
    $updateDiscardPredicateForUpdate = vip_updates_discard_predicate($pdo, 'vip_updates');

    if ($entryType === 'update') {
        $markReadStatement = $pdo->prepare(
            'UPDATE vip_updates
            SET is_read = 1
            WHERE id = :id
              AND applied_at IS NULL
              AND ' . $updateDiscardPredicateForUpdate
        );
        $markReadStatement->execute([
            ':id' => $id,
        ]);

        $statement = $pdo->prepare(
            '
            SELECT
                "update" AS entry_type,
                vu.id,
                vu.source_vip_id,
                vu.nickname,
                vu.generation,
                vu.gender,
                vu.location,
                vu.join_reason,
                vu.intro_text,
                vu.contact_type,
                vu.contact_info,
                vu.contact_qrcode_path,
                0 AS is_deleted,
                vu.is_read,
                vu.is_approved,
                ' . vip_updates_discard_select_sql($pdo, 'vu') . ',
                vu.approved_by,
                vu.approved_at,
                vu.created_at,
                vu.updated_at,
                vum.ip_address,
                vum.ip_lookup_location,
                vum.browser_name,
                vum.browser_version,
                vum.os_name,
                vum.os_version,
                vum.device_type,
                vum.fingerprint,
                COALESCE(fp.same_fingerprint_count, 0) AS same_fingerprint_count
            FROM vip_updates vu
            LEFT JOIN (
                SELECT latest.*
                FROM vip_meta latest
                INNER JOIN (
                    SELECT vip_update_id, MAX(id) AS latest_id
                    FROM vip_meta
                    WHERE vip_update_id IS NOT NULL
                    GROUP BY vip_update_id
                ) grouped ON grouped.latest_id = latest.id
            ) vum ON vum.vip_update_id = vu.id
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
            ) fp ON fp.fingerprint = vum.fingerprint
            WHERE vu.id = :id
              AND vu.applied_at IS NULL
              AND ' . $updateDiscardPredicate . '
            LIMIT 1
            '
        );
        $statement->execute([
            ':id' => $id,
        ]);
    } else {
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
                "vip" AS entry_type,
                v.id,
                NULL AS source_vip_id,
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
    }

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
              AND (:is_update = 1 OR v.id <> :id)
            ORDER BY v.id DESC
            '
        );
        $relatedStatement->execute([
            ':fingerprint' => $fingerprint,
            ':is_update' => $entryType === 'update' ? 1 : 0,
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
