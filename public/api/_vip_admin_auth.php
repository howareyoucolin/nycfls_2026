<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/bootstrap.php';
require_once __DIR__ . '/_response.php';
require_once __DIR__ . '/_clerk_jwt.php';

app_enforce_www_canonical_host();

function vip_admin_config_value(string $envKey, string $constKey, string $default = ''): string
{
    $envValue = getenv($envKey);
    if (is_string($envValue) && trim($envValue) !== '') {
        return trim($envValue);
    }

    if (defined($constKey)) {
        $constValue = constant($constKey);
        if (is_string($constValue) && trim($constValue) !== '') {
            return trim($constValue);
        }
    }

    return $default;
}

function vip_admin_csv_values(string $value): array
{
    $parts = preg_split('/[\s,]+/', trim($value)) ?: [];
    $normalized = [];

    foreach ($parts as $part) {
        $item = trim($part);
        if ($item !== '') {
            $normalized[] = $item;
        }
    }

    return array_values(array_unique($normalized));
}

function vip_admin_get_publishable_key(): string
{
    return 'pk_test_dHJ1c3RlZC1hbGJhY29yZS0wLmNsZXJrLmFjY291bnRzLmRldiQ';
}

function vip_admin_get_issuer(): string
{
    return 'https://trusted-albacore-0.clerk.accounts.dev';
}

function vip_admin_get_authorized_parties(): array
{
    return [
        'http://localhost:18084',
        'http://127.0.0.1:18084',
        'http://nycflushing.com',
        'http://www.nycflushing.com',
        'https://nycflushing.com',
        'https://www.nycflushing.com',
    ];
}

function vip_admin_get_canonical_origin(): string
{
    return 'https://www.nycflushing.com';
}

function vip_admin_is_local_host(string $host): bool
{
    $normalizedHost = strtolower(trim($host));
    return in_array($normalizedHost, ['localhost', '127.0.0.1'], true);
}

function vip_admin_request_scheme(): string
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

function vip_admin_enforce_canonical_origin(): void
{
    $host = trim((string) ($_SERVER['HTTP_HOST'] ?? ''));
    if ($host === '' || vip_admin_is_local_host($host)) {
        return;
    }

    $canonicalOrigin = vip_admin_get_canonical_origin();
    if ($canonicalOrigin === '') {
        return;
    }

    $currentOrigin = vip_admin_request_scheme() . '://' . $host;
    if (strcasecmp(rtrim($currentOrigin, '/'), rtrim($canonicalOrigin, '/')) === 0) {
        return;
    }

    $requestUri = (string) ($_SERVER['REQUEST_URI'] ?? '/');
    header('Location: ' . rtrim($canonicalOrigin, '/') . $requestUri, true, 302);
    exit;
}

function vip_admin_get_email_whitelist(): array
{
    return [
        'howareyoucolin@gmail.com',
    ];
}

function vip_admin_get_user_id_whitelist(): array
{
    return [
        'user_38VVcRNmFMLuMF5KraiFYo93S2l',
    ];
}

function vip_admin_get_bearer_token(): ?string
{
    $header = trim((string) ($_SERVER['HTTP_AUTHORIZATION'] ?? ''));
    if ($header === '' && function_exists('getallheaders')) {
        $headers = getallheaders();
        $header = trim((string) ($headers['Authorization'] ?? $headers['authorization'] ?? ''));
    }

    if (preg_match('/^Bearer\s+(.+)$/i', $header, $matches) !== 1) {
        return null;
    }

    return trim((string) ($matches[1] ?? ''));
}

function vip_admin_extract_emails(array $claims): array
{
    $emails = [];
    $directKeys = ['email', 'email_address', 'primary_email_address'];

    foreach ($directKeys as $key) {
        $value = trim((string) ($claims[$key] ?? ''));
        if ($value !== '') {
            $emails[] = mb_strtolower($value);
        }
    }

    foreach (['email_addresses', 'emails'] as $key) {
        $value = $claims[$key] ?? null;
        if (!is_array($value)) {
            continue;
        }

        foreach ($value as $item) {
            if (is_string($item) && trim($item) !== '') {
                $emails[] = mb_strtolower(trim($item));
                continue;
            }

            if (is_array($item)) {
                foreach (['email_address', 'email'] as $itemKey) {
                    $itemValue = trim((string) ($item[$itemKey] ?? ''));
                    if ($itemValue !== '') {
                        $emails[] = mb_strtolower($itemValue);
                    }
                }
            }
        }
    }

    return array_values(array_unique($emails));
}

function vip_admin_actor_label(array $claims): string
{
    $emails = vip_admin_extract_emails($claims);
    if ($emails !== []) {
        return $emails[0];
    }

    return trim((string) ($claims['sub'] ?? ''));
}

function vip_admin_is_authorized(array $claims): bool
{
    $userId = trim((string) ($claims['sub'] ?? ''));
    if ($userId !== '' && in_array($userId, vip_admin_get_user_id_whitelist(), true)) {
        return true;
    }

    $allowedEmails = vip_admin_get_email_whitelist();
    foreach (vip_admin_extract_emails($claims) as $email) {
        if (in_array($email, $allowedEmails, true)) {
            return true;
        }
    }

    return false;
}

function vip_admin_require_auth(): array
{
    $token = vip_admin_get_bearer_token();
    if ($token === null || $token === '') {
        api_error('unauthenticated', 'Missing Clerk bearer token.', 401);
    }

    $issuer = vip_admin_get_issuer();
    if ($issuer === '') {
        api_error('clerk_not_configured', 'CLERK_ISSUER is not configured.', 500);
    }

    $claims = null;
    $authorizedParties = vip_admin_get_authorized_parties();
    $verificationErrors = [];

    foreach ($authorizedParties !== [] ? $authorizedParties : [null] as $azp) {
        try {
            $claims = clerk_verify_jwt($token, $issuer, is_string($azp) ? $azp : null);
            break;
        } catch (Throwable $throwable) {
            $verificationErrors[] = $throwable->getMessage();
        }
    }

    if (!is_array($claims)) {
        api_error('invalid_token', 'Unable to verify Clerk session token.', 401, [
            'details' => $verificationErrors,
        ]);
    }

    if (!vip_admin_is_authorized($claims)) {
        api_error('forbidden', 'You are signed in but not on the VIP admin whitelist.', 403, [
            'user_id' => (string) ($claims['sub'] ?? ''),
            'emails' => vip_admin_extract_emails($claims),
        ]);
    }

    $claims['_actor_label'] = vip_admin_actor_label($claims);
    return $claims;
}

function vip_admin_request_json(): array
{
    $rawBody = file_get_contents('php://input');
    if (!is_string($rawBody) || trim($rawBody) === '') {
        return [];
    }

    $decoded = json_decode($rawBody, true);
    if (!is_array($decoded)) {
        api_error('invalid_json', 'Request body must be valid JSON.', 422);
    }

    return $decoded;
}
