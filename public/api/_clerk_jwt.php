<?php
declare(strict_types=1);

function base64url_decode_str(string $data): string
{
    $remainder = strlen($data) % 4;
    if ($remainder !== 0) {
        $data .= str_repeat('=', 4 - $remainder);
    }

    $decoded = base64_decode(strtr($data, '-_', '+/'), true);
    if ($decoded === false) {
        throw new RuntimeException('Invalid base64url payload.');
    }

    return $decoded;
}

function json_decode_assoc(string $json): array
{
    $decoded = json_decode($json, true);
    if (!is_array($decoded)) {
        throw new RuntimeException('Invalid JSON payload.');
    }

    return $decoded;
}

function http_get(string $url, int $timeoutSeconds = 3): string
{
    $context = stream_context_create([
        'http' => [
            'method' => 'GET',
            'timeout' => $timeoutSeconds,
            'header' => "Accept: application/json\r\n",
        ],
    ]);

    $body = @file_get_contents($url, false, $context);
    if (!is_string($body) || $body === '') {
        throw new RuntimeException('Failed to fetch remote JSON.');
    }

    return $body;
}

function jwks_cache_path(string $issuer): string
{
    $safeIssuer = preg_replace('/[^a-zA-Z0-9._-]/', '_', $issuer);
    return sys_get_temp_dir() . '/clerk_jwks_cache_' . $safeIssuer . '.json';
}

function fetch_jwks(string $issuer, int $cacheTtlSeconds = 3600): array
{
    $cachePath = jwks_cache_path($issuer);
    if (is_file($cachePath) && (time() - (int) filemtime($cachePath)) < $cacheTtlSeconds) {
        $cached = file_get_contents($cachePath);
        if (is_string($cached) && $cached !== '') {
            return json_decode_assoc($cached);
        }
    }

    $jwksJson = http_get(rtrim($issuer, '/') . '/.well-known/jwks.json');
    @file_put_contents($cachePath, $jwksJson);

    return json_decode_assoc($jwksJson);
}

function find_jwk_by_kid(array $jwks, string $keyId): ?array
{
    $keys = $jwks['keys'] ?? null;
    if (!is_array($keys)) {
        throw new RuntimeException('Invalid JWKS response.');
    }

    foreach ($keys as $key) {
        if (($key['kid'] ?? '') === $keyId) {
            return $key;
        }
    }

    return null;
}

function der_len(int $length): string
{
    if ($length < 0x80) {
        return chr($length);
    }

    $binary = ltrim(pack('N', $length), "\x00");
    return chr(0x80 | strlen($binary)) . $binary;
}

function der_int(string $binary): string
{
    if ($binary === '' || (ord($binary[0]) & 0x80) !== 0) {
        $binary = "\x00" . $binary;
    }

    return "\x02" . der_len(strlen($binary)) . $binary;
}

function der_seq(string $binary): string
{
    return "\x30" . der_len(strlen($binary)) . $binary;
}

function der_bitstr(string $binary): string
{
    return "\x03" . der_len(strlen($binary) + 1) . "\x00" . $binary;
}

function der_oid_rsa_encryption(): string
{
    return "\x06\x09\x2A\x86\x48\x86\xF7\x0D\x01\x01\x01";
}

function der_null(): string
{
    return "\x05\x00";
}

function jwk_rsa_to_pem(array $jwk): string
{
    if (($jwk['kty'] ?? '') !== 'RSA') {
        throw new RuntimeException('Unsupported key type.');
    }

    $modulus = base64url_decode_str((string) ($jwk['n'] ?? ''));
    $exponent = base64url_decode_str((string) ($jwk['e'] ?? ''));

    $rsaPublicKey = der_seq(der_int($modulus) . der_int($exponent));
    $algorithmIdentifier = der_seq(der_oid_rsa_encryption() . der_null());
    $subjectPublicKeyInfo = der_seq($algorithmIdentifier . der_bitstr($rsaPublicKey));

    return "-----BEGIN PUBLIC KEY-----\n"
        . chunk_split(base64_encode($subjectPublicKeyInfo), 64, "\n")
        . "-----END PUBLIC KEY-----\n";
}

function clerk_verify_jwt(string $jwt, string $issuer, ?string $expectedAzp = null): array
{
    $parts = explode('.', $jwt);
    if (count($parts) !== 3) {
        throw new RuntimeException('Invalid JWT format.');
    }

    [$encodedHeader, $encodedPayload, $encodedSignature] = $parts;
    $header = json_decode_assoc(base64url_decode_str($encodedHeader));
    $payload = json_decode_assoc(base64url_decode_str($encodedPayload));
    $signature = base64url_decode_str($encodedSignature);

    if (($header['typ'] ?? '') !== 'JWT') {
        throw new RuntimeException('Invalid JWT header type.');
    }

    if (($header['alg'] ?? '') !== 'RS256') {
        throw new RuntimeException('Invalid JWT algorithm.');
    }

    $keyId = (string) ($header['kid'] ?? '');
    if ($keyId === '') {
        throw new RuntimeException('Missing JWT key id.');
    }

    if (($payload['iss'] ?? '') !== $issuer) {
        throw new RuntimeException('Invalid JWT issuer.');
    }

    $now = time();
    $exp = (int) ($payload['exp'] ?? 0);
    $nbf = (int) ($payload['nbf'] ?? 0);

    if ($exp > 0 && $now >= $exp) {
        throw new RuntimeException('JWT has expired.');
    }

    if ($nbf > 0 && $now < $nbf) {
        throw new RuntimeException('JWT not active yet.');
    }

    if ($expectedAzp !== null && $expectedAzp !== '') {
        $azp = (string) ($payload['azp'] ?? '');
        if ($azp !== $expectedAzp) {
            throw new RuntimeException('Invalid authorized party.');
        }
    }

    $jwks = fetch_jwks($issuer);
    $matchingKey = find_jwk_by_kid($jwks, $keyId);

    if (!is_array($matchingKey)) {
        $jwks = fetch_jwks($issuer, 0);
        $matchingKey = find_jwk_by_kid($jwks, $keyId);
    }

    if (!is_array($matchingKey)) {
        throw new RuntimeException('Unable to find Clerk signing key after JWKS refresh.');
    }

    $publicKey = openssl_pkey_get_public(jwk_rsa_to_pem($matchingKey));
    if ($publicKey === false) {
        throw new RuntimeException('Unable to construct public key.');
    }

    $verified = openssl_verify($encodedHeader . '.' . $encodedPayload, $signature, $publicKey, OPENSSL_ALGO_SHA256);
    if ($verified !== 1) {
        throw new RuntimeException('Invalid Clerk JWT signature.');
    }

    return $payload;
}
