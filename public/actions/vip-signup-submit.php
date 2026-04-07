<?php
declare(strict_types=1);

require dirname(__DIR__) . '/bootstrap.php';
require dirname(__DIR__) . '/includes/vip_updates.php';

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'ok' => false,
        'message' => '请求方式不正确。',
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$isDebugMode = isset($_GET['debug']);

function respond(int $statusCode, array $payload): void
{
    http_response_code($statusCode);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

function post_string(string $key): string
{
    return trim((string) ($_POST[$key] ?? ''));
}

function app_config_value(string $envKey, string $constKey, string $default = ''): string
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

function app_base_url(): string
{
    $configured = app_config_value('APP_BASE_URL', 'APP_BASE_URL', '');
    if ($configured !== '') {
        return rtrim($configured, '/');
    }

    $host = trim((string) ($_SERVER['HTTP_HOST'] ?? ''));
    if ($host === '') {
        return '';
    }

    return app_request_scheme() . '://' . $host;
}

function telegram_post_request(string $url, array $payload): bool
{
    try {
        if (function_exists('curl_init')) {
            $curlHandle = curl_init($url);
            curl_setopt_array($curlHandle, [
                CURLOPT_POST => true,
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT => 4,
                CURLOPT_CONNECTTIMEOUT => 4,
                CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
                CURLOPT_POSTFIELDS => json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            ]);
            $responseBody = curl_exec($curlHandle);
            $httpCode = (int) curl_getinfo($curlHandle, CURLINFO_RESPONSE_CODE);
            curl_close($curlHandle);

            return is_string($responseBody) && $responseBody !== '' && $httpCode >= 200 && $httpCode < 300;
        }

        $context = stream_context_create([
            'http' => [
                'method' => 'POST',
                'timeout' => 4,
                'ignore_errors' => true,
                'header' => "Content-Type: application/json\r\n",
                'content' => json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            ],
        ]);

        $responseBody = @file_get_contents($url, false, $context);
        return is_string($responseBody) && $responseBody !== '';
    } catch (Throwable $exception) {
        return false;
    }
}

function send_telegram_signup_notification(array $signup): void
{
    $botToken = app_config_value('TELEGRAM_BOT_TOKEN', 'TELEGRAM_BOT_TOKEN', '');
    $chatId = app_config_value('TELEGRAM_CHAT_ID', 'TELEGRAM_CHAT_ID', '');

    if ($botToken === '' || $chatId === '') {
        return;
    }

    $vipId = (int) ($signup['id'] ?? 0);
    $existingVipId = (int) ($signup['existing_vip_id'] ?? 0);
    $entryType = (string) ($signup['entry_type'] ?? 'vip');
    $baseUrl = app_base_url();
    $adminUrl = '';
    if ($vipId > 0 && $baseUrl !== '') {
        $adminUrl = $baseUrl . '/vip/admin/vip/' . $vipId;
        if ($entryType === 'update') {
            $adminUrl .= '?entry=update';
        }
    }
    $contactLine = '不公开';

    if (($signup['contact_type'] ?? null) === 'qrcode') {
        $contactLine = '二维码';
    } elseif (!empty($signup['contact_type']) && !empty($signup['contact_info'])) {
        $contactLine = (string) $signup['contact_type'] . ': ' . (string) $signup['contact_info'];
    }

    $messageLines = [
        $entryType === 'update'
            ? 'VIP profile update submitted'
            : ($existingVipId > 0 ? 'Unapproved VIP profile updated' : 'New VIP signup submitted'),
        'ID: #' . $vipId,
        $entryType === 'update' && $existingVipId > 0 ? '基于资料: #' . $existingVipId : null,
        '昵称: ' . (string) ($signup['nickname'] ?? ''),
        '年代: ' . (string) ($signup['generation'] ?? ''),
        '性别: ' . (string) ($signup['gender'] ?? ''),
        '地区: ' . (string) ($signup['location'] ?? ''),
        '原因: ' . (string) ($signup['join_reason'] ?? ''),
        '联系: ' . $contactLine,
    ];

    $messageLines = array_values(array_filter($messageLines, static fn ($line): bool => is_string($line) && $line !== ''));

    if ($adminUrl !== '') {
        $messageLines[] = 'Admin: ' . $adminUrl;
    }

    telegram_post_request(
        'https://api.telegram.org/bot' . rawurlencode($botToken) . '/sendMessage',
        [
            'chat_id' => $chatId,
            'text' => implode("\n", $messageLines),
            'disable_web_page_preview' => true,
        ]
    );
}

function create_image_resource(string $tmpPath, string $mimeType): ?GdImage
{
    return match ($mimeType) {
        'image/jpeg' => imagecreatefromjpeg($tmpPath) ?: null,
        'image/png' => imagecreatefrompng($tmpPath) ?: null,
        'image/webp' => function_exists('imagecreatefromwebp') ? (imagecreatefromwebp($tmpPath) ?: null) : null,
        'image/gif' => imagecreatefromgif($tmpPath) ?: null,
        default => null,
    };
}

function save_optimized_image(GdImage $sourceImage, string $destinationPath, string $mimeType): bool
{
    return match ($mimeType) {
        'image/jpeg' => imagejpeg($sourceImage, $destinationPath, 82),
        'image/png' => imagepng($sourceImage, $destinationPath, 8),
        'image/webp' => function_exists('imagewebp') ? imagewebp($sourceImage, $destinationPath, 82) : false,
        'image/gif' => imagegif($sourceImage, $destinationPath),
        default => false,
    };
}

function detect_browser(string $userAgent): array
{
    $patterns = [
        'Edge' => '/Edg\/([0-9\.]+)/',
        'Chrome' => '/Chrome\/([0-9\.]+)/',
        'Firefox' => '/Firefox\/([0-9\.]+)/',
        'Safari' => '/Version\/([0-9\.]+).*Safari/',
    ];

    foreach ($patterns as $name => $pattern) {
        if (preg_match($pattern, $userAgent, $matches) === 1) {
            return [$name, $matches[1] ?? null];
        }
    }

    return [null, null];
}

function detect_os(string $userAgent): array
{
    $patterns = [
        'Windows' => '/Windows NT ([0-9\.]+)/',
        'Android' => '/Android ([0-9\.]+)/',
        'iOS' => '/iPhone OS ([0-9_]+)/',
        'iPadOS' => '/CPU OS ([0-9_]+)/',
        'macOS' => '/Mac OS X ([0-9_]+)/',
        'Linux' => '/Linux/',
    ];

    foreach ($patterns as $name => $pattern) {
        if (preg_match($pattern, $userAgent, $matches) === 1) {
            $version = $matches[1] ?? null;
            return [$name, $version !== null ? str_replace('_', '.', $version) : null];
        }
    }

    return [null, null];
}

function detect_device_type(string $userAgent): string
{
    $normalizedUserAgent = strtolower($userAgent);

    if (str_contains($normalizedUserAgent, 'tablet') || str_contains($normalizedUserAgent, 'ipad')) {
        return 'tablet';
    }

    if (str_contains($normalizedUserAgent, 'mobile') || str_contains($normalizedUserAgent, 'iphone') || str_contains($normalizedUserAgent, 'android')) {
        return 'mobile';
    }

    return 'desktop';
}

function is_public_ip(?string $ipAddress): bool
{
    if ($ipAddress === null || $ipAddress === '') {
        return false;
    }

    return filter_var($ipAddress, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) !== false;
}

function is_likely_proxy_ip(?string $ipAddress): bool
{
    if ($ipAddress === null || $ipAddress === '') {
        return false;
    }

    $proxyCidrs = [
        '104.16.0.0/13',
        '104.24.0.0/14',
        '108.162.192.0/18',
        '131.0.72.0/22',
        '141.101.64.0/18',
        '162.158.0.0/15',
        '172.64.0.0/13',
        '173.245.48.0/20',
        '188.114.96.0/20',
        '190.93.240.0/20',
        '197.234.240.0/22',
        '198.41.128.0/17',
    ];

    foreach ($proxyCidrs as $cidr) {
        if (ip_in_cidr($ipAddress, $cidr)) {
            return true;
        }
    }

    return false;
}

function ip_in_cidr(string $ipAddress, string $cidr): bool
{
    [$subnet, $maskBits] = explode('/', $cidr, 2);
    $ipLong = ip2long($ipAddress);
    $subnetLong = ip2long($subnet);

    if ($ipLong === false || $subnetLong === false) {
        return false;
    }

    $mask = -1 << (32 - (int) $maskBits);
    $subnetLong &= $mask;

    return ($ipLong & $mask) === $subnetLong;
}

function collect_client_ip_candidates(): array
{
    $candidates = [];

    $headerCandidates = [
        $_SERVER['HTTP_CF_CONNECTING_IP'] ?? null,
        $_SERVER['HTTP_X_REAL_IP'] ?? null,
        $_SERVER['HTTP_X_FORWARDED_FOR'] ?? null,
        $_SERVER['REMOTE_ADDR'] ?? null,
    ];

    foreach ($headerCandidates as $headerValue) {
        if (!is_string($headerValue) || trim($headerValue) === '') {
            continue;
        }

        foreach (explode(',', $headerValue) as $ipPart) {
            $ip = trim($ipPart);
            if ($ip !== '') {
                $candidates[] = $ip;
            }
        }
    }

    return array_values(array_unique($candidates));
}

function resolve_client_ip(): ?string
{
    $candidates = collect_client_ip_candidates();

    foreach ($candidates as $candidateIp) {
        if (is_public_ip($candidateIp) && !is_likely_proxy_ip($candidateIp)) {
            return $candidateIp;
        }
    }

    foreach ($candidates as $candidateIp) {
        if (is_public_ip($candidateIp)) {
            return $candidateIp;
        }
    }

    foreach ($candidates as $candidateIp) {
        if (filter_var($candidateIp, FILTER_VALIDATE_IP) !== false && !is_likely_proxy_ip($candidateIp)) {
            return $candidateIp;
        }
    }

    return null;
}

function http_json_request(string $url): ?array
{
    try {
        if (function_exists('curl_init')) {
            $curlHandle = curl_init($url);
            curl_setopt_array($curlHandle, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT => 3,
                CURLOPT_CONNECTTIMEOUT => 3,
                CURLOPT_HTTPHEADER => ['Accept: application/json'],
                CURLOPT_FOLLOWLOCATION => true,
            ]);
            $responseBody = curl_exec($curlHandle);
            $httpCode = (int) curl_getinfo($curlHandle, CURLINFO_RESPONSE_CODE);
            curl_close($curlHandle);

            if (!is_string($responseBody) || $responseBody === '' || $httpCode >= 400) {
                return null;
            }

            $decoded = json_decode($responseBody, true);
            return is_array($decoded) ? $decoded : null;
        }

        $context = stream_context_create([
            'http' => [
                'method' => 'GET',
                'timeout' => 3,
                'ignore_errors' => true,
                'header' => "Accept: application/json\r\n",
            ],
        ]);

        $responseBody = @file_get_contents($url, false, $context);
        if ($responseBody === false || $responseBody === '') {
            return null;
        }

        $decoded = json_decode($responseBody, true);
        if (!is_array($decoded)) {
            return null;
        }

        return $decoded;
    } catch (Throwable $exception) {
        return null;
    }
}

function collect_edge_location_hint(): array
{
    $parts = array_filter([
        trim((string) ($_SERVER['HTTP_CF_IPCITY'] ?? '')),
        trim((string) ($_SERVER['HTTP_CF_IPREGION'] ?? '')),
        trim((string) ($_SERVER['HTTP_CF_IPCOUNTRY'] ?? '')),
        trim((string) ($_SERVER['HTTP_CLOUDFRONT_VIEWER_CITY'] ?? '')),
        trim((string) ($_SERVER['HTTP_CLOUDFRONT_VIEWER_COUNTRY_REGION_NAME'] ?? '')),
        trim((string) ($_SERVER['HTTP_CLOUDFRONT_VIEWER_COUNTRY_NAME'] ?? '')),
    ]);

    $normalizedParts = [];
    foreach ($parts as $part) {
        if (!in_array($part, $normalizedParts, true)) {
            $normalizedParts[] = $part;
        }
    }

    if ($normalizedParts === []) {
        return [
            'location' => null,
            'source' => null,
        ];
    }

    return [
        'location' => implode(', ', $normalizedParts),
        'source' => 'edge_headers',
    ];
}

function fetch_ip_lookup_location_for_ip(string $ipAddress): array
{
    if (!is_public_ip($ipAddress)) {
        return [
            'location' => null,
            'source' => null,
        ];
    }

    $providers = [
        'ipwho' => 'https://ipwho.org/ip/' . rawurlencode($ipAddress),
        'freeipapi' => 'https://free.freeipapi.com/api/json/' . rawurlencode($ipAddress),
        'ipapi' => 'https://ipapi.co/' . rawurlencode($ipAddress) . '/json/',
    ];

    foreach ($providers as $source => $lookupUrl) {
        $decoded = http_json_request($lookupUrl);
        if (!is_array($decoded)) {
            continue;
        }

        $parts = [];

        if ($source === 'ipwho') {
            $parts = array_filter([
                trim((string) ($decoded['city'] ?? '')),
                trim((string) ($decoded['region'] ?? '')),
                trim((string) ($decoded['country'] ?? '')),
            ]);
        }

        if ($source === 'freeipapi') {
            $firstRow = isset($decoded[0]) && is_array($decoded[0]) ? $decoded[0] : $decoded;
            $parts = array_filter([
                trim((string) ($firstRow['cityName'] ?? '')),
                trim((string) ($firstRow['regionName'] ?? '')),
                trim((string) ($firstRow['countryName'] ?? '')),
            ]);
        }

        if ($source === 'ipapi') {
            $parts = array_filter([
                trim((string) ($decoded['city'] ?? '')),
                trim((string) ($decoded['region'] ?? '')),
                trim((string) ($decoded['country_name'] ?? '')),
            ]);
        }

        if ($parts !== []) {
            return [
                'location' => implode(', ', $parts),
                'source' => $source . ':' . $ipAddress,
            ];
        }
    }

    return [
        'location' => null,
        'source' => null,
    ];
}

function resolve_ip_lookup_location(array $ipCandidates): array
{
    foreach ($ipCandidates as $candidateIp) {
        if (is_likely_proxy_ip($candidateIp)) {
            continue;
        }

        $lookupResult = fetch_ip_lookup_location_for_ip($candidateIp);
        if (!empty($lookupResult['location'])) {
            return $lookupResult;
        }
    }

    return collect_edge_location_hint();
}

function collect_vip_meta(?int $vipId = null, ?int $vipUpdateId = null): array
{
    $userAgent = trim((string) ($_SERVER['HTTP_USER_AGENT'] ?? ''));
    [$browserName, $browserVersion] = detect_browser($userAgent);
    [$osName, $osVersion] = detect_os($userAgent);
    $ipCandidates = collect_client_ip_candidates();
    $ipAddress = resolve_client_ip();
    $publicIpCandidates = array_values(array_filter($ipCandidates, static fn (string $ip): bool => is_public_ip($ip)));
    $lookupReadyIpCandidates = array_values(array_filter(
        $publicIpCandidates,
        static fn (string $ip): bool => !is_likely_proxy_ip($ip)
    ));
    $lookupCandidates = $lookupReadyIpCandidates !== [] ? $lookupReadyIpCandidates : [];
    $lookupResult = resolve_ip_lookup_location($lookupCandidates);
    $fingerprint = trim((string) ($_POST['fingerprint'] ?? ''));
    if ($fingerprint === '') {
        $fingerprintSource = implode('|', [
            $userAgent,
            trim((string) ($_SERVER['HTTP_ACCEPT_LANGUAGE'] ?? '')),
            trim((string) ($_SERVER['HTTP_SEC_CH_UA'] ?? '')),
            trim((string) ($_SERVER['HTTP_SEC_CH_UA_PLATFORM'] ?? '')),
            trim((string) ($_SERVER['HTTP_SEC_CH_UA_MOBILE'] ?? '')),
            detect_device_type($userAgent),
            $browserName,
            $browserVersion,
            $osName,
            $osVersion,
        ]);

        if ($fingerprintSource !== '') {
            $fingerprint = hash('sha256', $fingerprintSource);
        }
    }

    return [
        'vip_id' => $vipId,
        'vip_update_id' => $vipUpdateId,
        'ip_address' => $ipAddress ?? '',
        'forwarded_for' => trim((string) ($_SERVER['HTTP_X_FORWARDED_FOR'] ?? '')),
        'user_agent' => $userAgent,
        'referer_url' => trim((string) ($_SERVER['HTTP_REFERER'] ?? '')),
        'browser_name' => $browserName,
        'browser_version' => $browserVersion,
        'os_name' => $osName,
        'os_version' => $osVersion,
        'device_type' => detect_device_type($userAgent),
        'fingerprint' => $fingerprint,
        'ip_lookup_location' => $lookupResult['location'],
        'extra_payload' => json_encode([
            'resolved_client_ip' => $ipAddress,
            'client_ip_candidates' => $ipCandidates,
            'public_ip_candidates' => $publicIpCandidates,
            'lookup_ready_ip_candidates' => $lookupReadyIpCandidates,
            'ip_lookup_source' => $lookupResult['source'],
            'request_scheme' => $_SERVER['REQUEST_SCHEME'] ?? null,
            'server_name' => $_SERVER['SERVER_NAME'] ?? null,
            'server_port' => $_SERVER['SERVER_PORT'] ?? null,
        ], JSON_UNESCAPED_UNICODE),
    ];
}

function store_vip_meta(PDO $pdo, array $meta): void
{
    $statement = $pdo->prepare(
        'INSERT INTO vip_meta (
            vip_id,
            vip_update_id,
            ip_address,
            forwarded_for,
            user_agent,
            referer_url,
            browser_name,
            browser_version,
            os_name,
            os_version,
            device_type,
            fingerprint,
            ip_lookup_location,
            extra_payload
        ) VALUES (
            :vip_id,
            :vip_update_id,
            :ip_address,
            :forwarded_for,
            :user_agent,
            :referer_url,
            :browser_name,
            :browser_version,
            :os_name,
            :os_version,
            :device_type,
            :fingerprint,
            :ip_lookup_location,
            :extra_payload
        )'
    );

    $statement->execute([
        ':vip_id' => $meta['vip_id'],
        ':vip_update_id' => $meta['vip_update_id'],
        ':ip_address' => $meta['ip_address'] !== '' ? $meta['ip_address'] : null,
        ':forwarded_for' => $meta['forwarded_for'] !== '' ? $meta['forwarded_for'] : null,
        ':user_agent' => $meta['user_agent'] !== '' ? $meta['user_agent'] : null,
        ':referer_url' => $meta['referer_url'] !== '' ? $meta['referer_url'] : null,
        ':browser_name' => $meta['browser_name'],
        ':browser_version' => $meta['browser_version'],
        ':os_name' => $meta['os_name'],
        ':os_version' => $meta['os_version'],
        ':device_type' => $meta['device_type'],
        ':fingerprint' => $meta['fingerprint'] !== '' ? $meta['fingerprint'] : null,
        ':ip_lookup_location' => $meta['ip_lookup_location'],
        ':extra_payload' => $meta['extra_payload'],
    ]);
}

$generationMap = [
    '70后' => '70',
    '80后' => '80',
    '90后' => '90',
    '00后' => '00',
];

$genderMap = [
    '男生' => 'm',
    '女生' => 'f',
];

$joinReasonMap = [
    '结婚' => '结婚',
    '恋爱' => '恋爱',
    '交朋友' => '交朋友',
    '搭子' => '搭子',
];

$nickname = post_string('nickname');
$generationInput = post_string('generation');
$genderInput = post_string('gender');
$locationInput = post_string('location');
$locationOther = post_string('location_other');
$joinReasonInput = post_string('join_reason');
$joinReasonOther = post_string('join_reason_other');
$introText = post_string('intro_text');
$contactVisibility = post_string('contact_visibility');
$contactType = post_string('contact_type');
$contactInfo = post_string('contact_info');
$existingVipId = (int) post_string('existing_vip_id');
$existingContactQrcodePathRaw = trim((string) ($_POST['contact_qrcode_existing_path'] ?? ''));
$existingContactQrcodePath = $existingContactQrcodePathRaw !== '' ? ltrim($existingContactQrcodePathRaw, '/') : null;

$location = $locationInput === 'other' ? $locationOther : $locationInput;
$joinReason = $joinReasonInput === 'other' ? $joinReasonOther : ($joinReasonMap[$joinReasonInput] ?? $joinReasonInput);
$generation = $generationMap[$generationInput] ?? '';
$gender = $genderMap[$genderInput] ?? '';

$normalizedContactType = in_array($contactType, ['wechat', 'phone', 'email', 'qrcode'], true) ? $contactType : null;
if ($contactVisibility !== 'yes') {
    $normalizedContactType = null;
    $contactInfo = '';
}

$contactQrcodePath = null;

if (!$isDebugMode) {
    if ($nickname === '') {
        respond(422, ['ok' => false, 'message' => '请填写昵称。']);
    }

    if ($generation === '') {
        respond(422, ['ok' => false, 'message' => '请选择出生年代。']);
    }

    if ($gender === '') {
        respond(422, ['ok' => false, 'message' => '请选择性别。']);
    }

    if ($location === '') {
        respond(422, ['ok' => false, 'message' => '请选择所在地。']);
    }

    if ($joinReason === '') {
        respond(422, ['ok' => false, 'message' => '请选择加入群组的原因。']);
    }

    if (mb_strlen($introText) < 40) {
        respond(422, ['ok' => false, 'message' => '自我介绍至少需要填写 40 个字。']);
    }

    if (mb_strlen($introText) > 2000) {
        respond(422, ['ok' => false, 'message' => '自我介绍最多可填写 2000 个字。']);
    }

    if ($contactVisibility === 'yes' && $normalizedContactType === null) {
        respond(422, ['ok' => false, 'message' => '请选择联系方式类型。']);
    }

    if ($normalizedContactType !== null && $normalizedContactType !== 'qrcode' && $contactInfo === '') {
        respond(422, ['ok' => false, 'message' => '请填写联系方式内容。']);
    }

    if ($normalizedContactType === 'qrcode' && empty($_FILES['contact_qrcode']['name']) && $existingContactQrcodePath === null) {
        respond(422, ['ok' => false, 'message' => '请上传二维码图片。']);
    }
}

if ($normalizedContactType === 'qrcode' && !empty($_FILES['contact_qrcode']['name'])) {
    $upload = $_FILES['contact_qrcode'];

    if (($upload['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
        respond(422, ['ok' => false, 'message' => '二维码上传失败，请重试。']);
    }

    $tmpPath = (string) ($upload['tmp_name'] ?? '');
    $mimeType = mime_content_type($tmpPath) ?: '';
    $allowedMimeTypes = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
        'image/gif' => 'gif',
    ];

    if (!isset($allowedMimeTypes[$mimeType])) {
        respond(422, ['ok' => false, 'message' => '二维码图片格式不支持。']);
    }

    $uploadDirectory = ROOT_PATH . 'uploads/vip-qrcodes';
    if (!is_dir($uploadDirectory) && !mkdir($uploadDirectory, 0775, true) && !is_dir($uploadDirectory)) {
        respond(500, ['ok' => false, 'message' => '上传目录创建失败。']);
    }

    $filename = sprintf(
        'qrcode-%s-%s.%s',
        date('YmdHis'),
        bin2hex(random_bytes(6)),
        $allowedMimeTypes[$mimeType]
    );
    $destinationPath = $uploadDirectory . '/' . $filename;

    $saved = false;
    if (extension_loaded('gd')) {
        $sourceImage = create_image_resource($tmpPath, $mimeType);

        if ($sourceImage instanceof GdImage) {
            $sourceWidth = imagesx($sourceImage);
            $sourceHeight = imagesy($sourceImage);
            $maxDimension = 480;
            $scale = min(1, $maxDimension / max($sourceWidth, $sourceHeight));
            $targetWidth = max(1, (int) round($sourceWidth * $scale));
            $targetHeight = max(1, (int) round($sourceHeight * $scale));
            $targetImage = imagecreatetruecolor($targetWidth, $targetHeight);

            if (in_array($mimeType, ['image/png', 'image/webp', 'image/gif'], true)) {
                imagealphablending($targetImage, false);
                imagesavealpha($targetImage, true);
                $transparent = imagecolorallocatealpha($targetImage, 0, 0, 0, 127);
                imagefilledrectangle($targetImage, 0, 0, $targetWidth, $targetHeight, $transparent);
            }

            imagecopyresampled(
                $targetImage,
                $sourceImage,
                0,
                0,
                0,
                0,
                $targetWidth,
                $targetHeight,
                $sourceWidth,
                $sourceHeight
            );

            $saved = save_optimized_image($targetImage, $destinationPath, $mimeType);

            imagedestroy($targetImage);
            imagedestroy($sourceImage);
        }
    }

    if (!$saved) {
        $saved = move_uploaded_file($tmpPath, $destinationPath);
    }

    if (!$saved) {
        respond(500, ['ok' => false, 'message' => '二维码图片保存失败。']);
    }

    $contactQrcodePath = 'uploads/vip-qrcodes/' . $filename;
    $contactInfo = '';
} elseif ($normalizedContactType === 'qrcode') {
    $contactQrcodePath = $existingContactQrcodePath;
    $contactInfo = '';
}

if ($normalizedContactType === null) {
    $contactInfo = null;
}

try {
    $pdo = db();
    $pdo->beginTransaction();

    $entryType = 'vip';
    $recordId = 0;
    $vipId = 0;
    $fingerprintMeta = collect_vip_meta();
    $fingerprint = trim((string) ($fingerprintMeta['fingerprint'] ?? ''));

    if ($existingVipId > 0) {
        $existingVipStatement = $pdo->prepare('SELECT id, is_approved, is_read, approved_by, approved_at FROM vips WHERE id = :id AND is_deleted = 0 LIMIT 1');
        $existingVipStatement->execute([
            ':id' => $existingVipId,
        ]);
        $existingVip = $existingVipStatement->fetch();

        if (!is_array($existingVip)) {
            $pdo->rollBack();
            respond(404, ['ok' => false, 'message' => '当前资料不存在，无法提交更新。']);
        }

        $vipId = $existingVipId;
        $existingVipApproved = (int) ($existingVip['is_approved'] ?? 0) === 1;

        if (!$existingVipApproved) {
            $updateVipStatement = $pdo->prepare(
                'UPDATE vips
                SET
                    nickname = :nickname,
                    generation = :generation,
                    gender = :gender,
                    location = :location,
                    join_reason = :join_reason,
                    intro_text = :intro_text,
                    contact_type = :contact_type,
                    contact_info = :contact_info,
                    contact_qrcode_path = :contact_qrcode_path,
                    is_read = 0,
                    is_approved = :is_approved,
                    approved_by = :approved_by,
                    approved_at = :approved_at
                WHERE id = :id'
            );
            $updateVipStatement->execute([
                ':id' => $existingVipId,
                ':nickname' => $nickname,
                ':generation' => $generation,
                ':gender' => $gender,
                ':location' => $location,
                ':join_reason' => $joinReason,
                ':intro_text' => $introText,
                ':contact_type' => $normalizedContactType,
                ':contact_info' => $contactInfo,
                ':contact_qrcode_path' => $contactQrcodePath,
                ':is_approved' => 0,
                ':approved_by' => $existingVip['approved_by'] ?? null,
                ':approved_at' => $existingVip['approved_at'] ?? null,
            ]);
            $recordId = $existingVipId;
            store_vip_meta($pdo, collect_vip_meta($existingVipId, null));
        } else {
            $entryType = 'update';
            $pendingUpdateId = 0;

            if ($fingerprint !== '') {
                $updateDiscardPredicate = vip_updates_discard_predicate($pdo, 'vu');
                $pendingUpdateStatement = $pdo->prepare(
                    'SELECT vu.id
                    FROM vip_updates vu
                    INNER JOIN (
                        SELECT latest.vip_update_id, latest.fingerprint
                        FROM vip_meta latest
                        INNER JOIN (
                            SELECT vip_update_id, MAX(id) AS latest_id
                            FROM vip_meta
                            WHERE vip_update_id IS NOT NULL
                            GROUP BY vip_update_id
                        ) grouped ON grouped.latest_id = latest.id
                        WHERE latest.vip_update_id IS NOT NULL
                    ) vm ON vm.vip_update_id = vu.id
                    WHERE vu.source_vip_id = :source_vip_id
                      AND vu.applied_at IS NULL
                      AND ' . $updateDiscardPredicate . '
                      AND vm.fingerprint = :fingerprint
                    ORDER BY vu.updated_at DESC, vu.id DESC
                    LIMIT 1'
                );
                $pendingUpdateStatement->execute([
                    ':source_vip_id' => $existingVipId,
                    ':fingerprint' => $fingerprint,
                ]);
                $pendingUpdateId = (int) $pendingUpdateStatement->fetchColumn();
            }

            if ($pendingUpdateId > 0) {
                $updateStatement = $pdo->prepare(
                    'UPDATE vip_updates
                    SET
                        nickname = :nickname,
                        generation = :generation,
                        gender = :gender,
                        location = :location,
                        join_reason = :join_reason,
                        intro_text = :intro_text,
                        contact_type = :contact_type,
                        contact_info = :contact_info,
                        contact_qrcode_path = :contact_qrcode_path,
                        is_read = 0,
                        is_approved = 0,
                        approved_by = NULL,
                        approved_at = NULL,
                        applied_at = NULL
                    WHERE id = :id'
                );
                $updateStatement->execute([
                    ':id' => $pendingUpdateId,
                    ':nickname' => $nickname,
                    ':generation' => $generation,
                    ':gender' => $gender,
                    ':location' => $location,
                    ':join_reason' => $joinReason,
                    ':intro_text' => $introText,
                    ':contact_type' => $normalizedContactType,
                    ':contact_info' => $contactInfo,
                    ':contact_qrcode_path' => $contactQrcodePath,
                ]);
                $recordId = $pendingUpdateId;
            } else {
                $insertUpdateStatement = $pdo->prepare(
                    'INSERT INTO vip_updates (
                        source_vip_id,
                        nickname,
                        generation,
                        gender,
                        location,
                        join_reason,
                        intro_text,
                        contact_type,
                        contact_info,
                        contact_qrcode_path,
                        is_read,
                        is_approved,
                        approved_by,
                        approved_at,
                        applied_at
                    ) VALUES (
                        :source_vip_id,
                        :nickname,
                        :generation,
                        :gender,
                        :location,
                        :join_reason,
                        :intro_text,
                        :contact_type,
                        :contact_info,
                        :contact_qrcode_path,
                        0,
                        0,
                        NULL,
                        NULL,
                        NULL
                    )'
                );
                $insertUpdateStatement->execute([
                    ':source_vip_id' => $existingVipId,
                    ':nickname' => $nickname,
                    ':generation' => $generation,
                    ':gender' => $gender,
                    ':location' => $location,
                    ':join_reason' => $joinReason,
                    ':intro_text' => $introText,
                    ':contact_type' => $normalizedContactType,
                    ':contact_info' => $contactInfo,
                    ':contact_qrcode_path' => $contactQrcodePath,
                ]);
                $recordId = (int) $pdo->lastInsertId();
            }

            store_vip_meta($pdo, collect_vip_meta(null, $recordId));
        }
    } else {
        $statement = $pdo->prepare(
            'INSERT INTO vips (
                nickname,
                generation,
                gender,
                location,
                join_reason,
                intro_text,
                contact_type,
                contact_info,
                contact_qrcode_path,
                is_approved,
                approved_by,
                approved_at
            ) VALUES (
                :nickname,
                :generation,
                :gender,
                :location,
                :join_reason,
                :intro_text,
                :contact_type,
                :contact_info,
                :contact_qrcode_path,
                0,
                NULL,
                NULL
            )'
        );

        $statement->execute([
            ':nickname' => $nickname,
            ':generation' => $generation,
            ':gender' => $gender,
            ':location' => $location,
            ':join_reason' => $joinReason,
            ':intro_text' => $introText,
            ':contact_type' => $normalizedContactType,
            ':contact_info' => $contactInfo,
            ':contact_qrcode_path' => $contactQrcodePath,
        ]);

        $vipId = (int) $pdo->lastInsertId();
        $recordId = $vipId;
        store_vip_meta($pdo, collect_vip_meta($vipId, null));
    }

    $pdo->commit();

    send_telegram_signup_notification([
        'id' => $recordId,
        'existing_vip_id' => $existingVipId,
        'entry_type' => $entryType,
        'nickname' => $nickname,
        'generation' => $generation,
        'gender' => $gender,
        'location' => $location,
        'join_reason' => $joinReason,
        'contact_type' => $normalizedContactType,
        'contact_info' => $contactInfo,
    ]);
} catch (Throwable $exception) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    respond(500, [
        'ok' => false,
        'message' => '资料保存失败，请稍后再试。',
    ]);
}

respond(200, [
    'ok' => true,
    'message' => $existingVipId > 0 ? '更新已提交。' : '提交成功。',
]);
