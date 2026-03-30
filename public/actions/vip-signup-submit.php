<?php
declare(strict_types=1);

require dirname(__DIR__) . '/bootstrap.php';

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

    if ($contactVisibility === 'yes' && $normalizedContactType === null) {
        respond(422, ['ok' => false, 'message' => '请选择联系方式类型。']);
    }

    if ($normalizedContactType !== null && $normalizedContactType !== 'qrcode' && $contactInfo === '') {
        respond(422, ['ok' => false, 'message' => '请填写联系方式内容。']);
    }

    if ($normalizedContactType === 'qrcode' && empty($_FILES['contact_qrcode']['name'])) {
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

    if (!move_uploaded_file($tmpPath, $destinationPath)) {
        respond(500, ['ok' => false, 'message' => '二维码图片保存失败。']);
    }

    $contactQrcodePath = 'uploads/vip-qrcodes/' . $filename;
    $contactInfo = '';
}

if ($normalizedContactType === null) {
    $contactInfo = null;
}

try {
    $statement = db()->prepare(
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
} catch (Throwable $exception) {
    respond(500, [
        'ok' => false,
        'message' => '资料保存失败，请稍后再试。',
    ]);
}

respond(200, [
    'ok' => true,
    'message' => '提交成功。',
]);
