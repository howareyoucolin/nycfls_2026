<?php
declare(strict_types=1);

if (!defined('ROOT_PATH')) {
    define('ROOT_PATH', __DIR__ . '/');
}

function app_is_local_host(string $host): bool
{
    $normalizedHost = strtolower(trim($host));
    return in_array($normalizedHost, ['localhost', '127.0.0.1'], true);
}

function app_request_scheme(): string
{
    $https = strtolower((string) ($_SERVER['HTTPS'] ?? ''));
    if ($https !== '' && $https !== 'off') {
        return 'https';
    }

    $forwardedProto = strtolower(trim((string) ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '')));
    if ($forwardedProto !== '') {
        $parts = explode(',', $forwardedProto);
        return trim($parts[0]) === 'https' ? 'https' : 'http';
    }

    return 'http';
}

function app_enforce_www_canonical_host(): void
{
    $host = trim((string) ($_SERVER['HTTP_HOST'] ?? ''));
    if ($host === '' || app_is_local_host($host)) {
        return;
    }

    $normalizedHost = strtolower($host);
    $canonicalHost = 'www.nycflushing.com';
    $requestUri = (string) ($_SERVER['REQUEST_URI'] ?? '/');

    if ($normalizedHost === $canonicalHost && app_request_scheme() === 'https') {
        return;
    }

    header('Location: https://' . $canonicalHost . $requestUri, true, 302);
    exit;
}

$configFile = ROOT_PATH . 'config.php';
$configSampleFile = ROOT_PATH . 'config.php.sample';

if (is_file($configFile)) {
    require_once $configFile;
} elseif (is_file($configSampleFile)) {
    require_once $configSampleFile;
}

require_once ROOT_PATH . 'includes/database.php';

$GLOBALS['app'] = [
    'db' => db(),
];
