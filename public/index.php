<?php
declare(strict_types=1);

$requestPath = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
$basePath = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? '')), '/');

if ($basePath !== '' && $basePath !== '/' && str_starts_with($requestPath, $basePath)) {
    $requestPath = substr($requestPath, strlen($basePath));
}

$uri = trim($requestPath ?: '/', '/');
$pagesDirectory = __DIR__ . '/pages';
$normalizedPath = $uri === '' ? 'home' : $uri;
$segments = array_values(array_filter(explode('/', $normalizedPath), static fn (string $segment): bool => $segment !== ''));

$safeSegments = [];
foreach ($segments as $segment) {
    if (!preg_match('/^[A-Za-z0-9_-]+$/', $segment)) {
        http_response_code(404);
        require $pagesDirectory . '/404.php';
        exit;
    }

    $safeSegments[] = $segment;
}

$pageFile = $pagesDirectory . '/' . implode('/', $safeSegments) . '.php';

if (!is_file($pageFile)) {
    http_response_code(404);
    require $pagesDirectory . '/404.php';
    exit;
}

require $pageFile;
