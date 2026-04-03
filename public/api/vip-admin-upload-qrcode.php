<?php
declare(strict_types=1);

require_once __DIR__ . '/_vip_admin_auth.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'POST') !== 'POST') {
    api_error('method_not_allowed', 'Only POST is allowed.', 405);
}

vip_admin_require_auth();

$upload = $_FILES['contact_qrcode'] ?? null;
if (!is_array($upload) || empty($upload['name'])) {
    api_error('missing_file', '请上传二维码图片。', 422);
}

if (($upload['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
    api_error('upload_failed', '二维码上传失败，请重试。', 422);
}

$tmpPath = (string) ($upload['tmp_name'] ?? '');
if ($tmpPath === '' || !is_uploaded_file($tmpPath)) {
    api_error('invalid_upload', '上传文件无效。', 422);
}

$mimeType = '';
if (function_exists('finfo_open')) {
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    if ($finfo !== false) {
        $mimeType = (string) finfo_file($finfo, $tmpPath);
        finfo_close($finfo);
    }
}

$allowedMimeMap = [
    'image/jpeg' => 'jpg',
    'image/png' => 'png',
    'image/gif' => 'gif',
    'image/webp' => 'webp',
];

$extension = $allowedMimeMap[$mimeType] ?? '';
if ($extension === '') {
    api_error('invalid_file_type', '二维码图片格式不支持。', 422);
}

$uploadDirectory = ROOT_PATH . 'uploads/vip-qrcodes';
if (!is_dir($uploadDirectory) && !mkdir($uploadDirectory, 0775, true) && !is_dir($uploadDirectory)) {
    api_error('upload_dir_failed', '二维码上传目录创建失败。', 500);
}

$filename = sprintf(
    'qrcode-admin-%s-%s.%s',
    date('YmdHis'),
    bin2hex(random_bytes(6)),
    $extension
);

$destinationPath = $uploadDirectory . '/' . $filename;
if (!move_uploaded_file($tmpPath, $destinationPath)) {
    api_error('save_failed', '二维码图片保存失败。', 500);
}

api_ok([
    'path' => 'uploads/vip-qrcodes/' . $filename,
], '二维码上传成功。');
