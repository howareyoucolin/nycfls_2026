<?php
declare(strict_types=1);

require_once __DIR__ . '/_vip_admin_auth.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    api_error('method_not_allowed', 'Only GET is allowed.', 405);
}

$claims = vip_admin_require_auth();

$status = trim((string) ($_GET['status'] ?? 'all'));
$allowedStatuses = ['all', 'approved', 'pending'];
if (!in_array($status, $allowedStatuses, true)) {
    $status = 'all';
}

$search = trim((string) ($_GET['search'] ?? ''));
$searchTerm = $search !== '' ? '%' . $search . '%' : null;
$perPage = (int) ($_GET['per_page'] ?? 50);
if ($perPage <= 0) {
    $perPage = 50;
}
$perPage = min($perPage, 100);

$page = (int) ($_GET['page'] ?? 1);
if ($page <= 0) {
    $page = 1;
}

$whereParts = [];
$params = [];

if ($status === 'approved') {
    $whereParts[] = 'v.is_approved = 1';
} elseif ($status === 'pending') {
    $whereParts[] = 'v.is_approved = 0';
}

if ($searchTerm !== null) {
    $whereParts[] = '(v.nickname LIKE :search OR v.location LIKE :search OR v.join_reason LIKE :search OR v.intro_text LIKE :search)';
    $params[':search'] = $searchTerm;
}

$whereSql = $whereParts !== [] ? ('WHERE ' . implode(' AND ', $whereParts)) : '';

try {
    $pdo = db();
    $countSql = 'SELECT COUNT(*) FROM vips v ' . $whereSql;
    $countStatement = $pdo->prepare($countSql);
    foreach ($params as $key => $value) {
        $countStatement->bindValue($key, $value);
    }
    $countStatement->execute();
    $filteredTotal = (int) $countStatement->fetchColumn();

    $totalPages = max(1, (int) ceil($filteredTotal / $perPage));
    if ($page > $totalPages) {
        $page = $totalPages;
    }
    $offset = ($page - 1) * $perPage;

    $listSql = '
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
            vm.device_type
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
        ' . $whereSql . '
        ORDER BY v.created_at DESC, v.id DESC
        LIMIT :limit OFFSET :offset';

    $statement = $pdo->prepare($listSql);
    foreach ($params as $key => $value) {
        $statement->bindValue($key, $value);
    }
    $statement->bindValue(':limit', $perPage, PDO::PARAM_INT);
    $statement->bindValue(':offset', $offset, PDO::PARAM_INT);
    $statement->execute();
    $items = $statement->fetchAll();

    $counts = [
        'all' => (int) $pdo->query('SELECT COUNT(*) FROM vips')->fetchColumn(),
        'approved' => (int) $pdo->query('SELECT COUNT(*) FROM vips WHERE is_approved = 1')->fetchColumn(),
        'pending' => (int) $pdo->query('SELECT COUNT(*) FROM vips WHERE is_approved = 0')->fetchColumn(),
    ];

    api_ok([
        'items' => $items,
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
