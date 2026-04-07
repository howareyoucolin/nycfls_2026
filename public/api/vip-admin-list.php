<?php
declare(strict_types=1);

require_once __DIR__ . '/_vip_admin_auth.php';
require_once dirname(__DIR__) . '/includes/vip_updates.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    api_error('method_not_allowed', 'Only GET is allowed.', 405);
}

$claims = vip_admin_require_auth();

$status = trim((string) ($_GET['status'] ?? 'unread'));
$allowedStatuses = ['all', 'approved', 'not_approved', 'unread', 'deleted', 'pending_updates'];
if (!in_array($status, $allowedStatuses, true)) {
    $status = 'unread';
}

$search = trim((string) ($_GET['search'] ?? ''));
$searchLower = mb_strtolower($search);
$perPage = (int) ($_GET['per_page'] ?? 50);
if ($perPage <= 0) {
    $perPage = 50;
}
$perPage = min($perPage, 100);

$page = (int) ($_GET['page'] ?? 1);
if ($page <= 0) {
    $page = 1;
}

function vip_admin_matches_search(array $item, string $search, string $searchLower): bool
{
    if ($search === '') {
        return true;
    }

    $nickname = mb_strtolower(trim((string) ($item['nickname'] ?? '')));
    if ($nickname !== '' && mb_strpos($nickname, $searchLower) !== false) {
        return true;
    }

    if (!ctype_digit($search)) {
        return false;
    }

    if ((string) ((int) ($item['id'] ?? 0)) === $search) {
        return true;
    }

    return (string) ((int) ($item['source_vip_id'] ?? 0)) === $search;
}

function vip_admin_sort_items(array &$items): void
{
    usort($items, static function (array $left, array $right): int {
        $leftUpdated = strtotime((string) ($left['updated_at'] ?? '')) ?: 0;
        $rightUpdated = strtotime((string) ($right['updated_at'] ?? '')) ?: 0;
        if ($leftUpdated !== $rightUpdated) {
            return $rightUpdated <=> $leftUpdated;
        }

        $leftCreated = strtotime((string) ($left['created_at'] ?? '')) ?: 0;
        $rightCreated = strtotime((string) ($right['created_at'] ?? '')) ?: 0;
        if ($leftCreated !== $rightCreated) {
            return $rightCreated <=> $leftCreated;
        }

        return ((int) ($right['id'] ?? 0)) <=> ((int) ($left['id'] ?? 0));
    });
}

try {
    $pdo = db();
    $updateDiscardPredicate = vip_updates_discard_predicate($pdo, 'vu');
    $updateDiscardSelect = vip_updates_discard_select_sql($pdo, 'vu');

    $vipItems = $pdo->query(
        'SELECT
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
            NULL AS applied_at
        FROM vips v'
    )->fetchAll();

    $updateItems = $pdo->query(
        'SELECT
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
            ' . $updateDiscardSelect . ',
            vu.approved_by,
            vu.approved_at,
            vu.created_at,
            vu.updated_at,
            vu.applied_at
        FROM vip_updates vu
        WHERE vu.applied_at IS NULL
          AND ' . $updateDiscardPredicate
    )->fetchAll();

    $counts = [
        'all' => 0,
        'approved' => 0,
        'not_approved' => 0,
        'unread' => 0,
        'deleted' => 0,
        'pending_updates' => 0,
        'pending_updates_unread' => 0,
    ];

    foreach ($vipItems as $item) {
        $isDeleted = (int) ($item['is_deleted'] ?? 0) === 1;
        $isApproved = (int) ($item['is_approved'] ?? 0) === 1;
        $isRead = (int) ($item['is_read'] ?? 0) === 1;

        if ($isDeleted) {
            $counts['deleted'] += 1;
            continue;
        }

        $counts['all'] += 1;
        if ($isApproved) {
            $counts['approved'] += 1;
        } else {
            $counts['not_approved'] += 1;
        }
        if (!$isRead) {
            $counts['unread'] += 1;
        }
    }

    foreach ($updateItems as $item) {
        $isRead = (int) ($item['is_read'] ?? 0) === 1;
        $counts['pending_updates'] += 1;
        if (!$isRead) {
            $counts['pending_updates_unread'] += 1;
        }
    }

    $items = [];

    if ($status === 'deleted') {
        foreach ($vipItems as $item) {
            if ((int) ($item['is_deleted'] ?? 0) !== 1) {
                continue;
            }
            if (!vip_admin_matches_search($item, $search, $searchLower)) {
                continue;
            }
            $items[] = $item;
        }
    } elseif ($status === 'pending_updates') {
        foreach ($updateItems as $item) {
            if (!vip_admin_matches_search($item, $search, $searchLower)) {
                continue;
            }
            $items[] = $item;
        }
    } else {
        foreach ($vipItems as $item) {
            $isDeleted = (int) ($item['is_deleted'] ?? 0) === 1;
            $isApproved = (int) ($item['is_approved'] ?? 0) === 1;
            $isRead = (int) ($item['is_read'] ?? 0) === 1;

            if ($isDeleted) {
                continue;
            }
            if ($status === 'approved' && !$isApproved) {
                continue;
            }
            if ($status === 'not_approved' && $isApproved) {
                continue;
            }
            if ($status === 'unread' && $isRead) {
                continue;
            }
            if (!vip_admin_matches_search($item, $search, $searchLower)) {
                continue;
            }
            $items[] = $item;
        }
    }

    vip_admin_sort_items($items);
    $filteredTotal = count($items);
    $totalPages = max(1, (int) ceil($filteredTotal / $perPage));
    if ($page > $totalPages) {
        $page = $totalPages;
    }
    $offset = ($page - 1) * $perPage;
    $items = array_slice($items, $offset, $perPage);

    api_ok([
        'items' => array_values($items),
        'counts' => $counts,
        'filters' => [
            'status' => $status,
            'search' => $search,
            'page' => $page,
            'per_page' => $perPage,
        ],
        'pagination' => [
            'page' => $page,
            'per_page' => $perPage,
            'total_items' => $filteredTotal,
            'total_pages' => $totalPages,
        ],
        'viewer' => [
            'user_id' => (string) ($claims['sub'] ?? ''),
            'label' => (string) ($claims['_actor_label'] ?? ''),
            'email' => (string) ($claims['_viewer_email'] ?? ''),
            'role' => (string) ($claims['_viewer_role'] ?? ''),
        ],
    ], 'Loaded VIP signups.');
} catch (Throwable $throwable) {
    api_error('server_error', 'Unable to load VIP signups right now.', 500);
}
