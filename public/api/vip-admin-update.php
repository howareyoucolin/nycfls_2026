<?php
declare(strict_types=1);

require_once __DIR__ . '/_vip_admin_auth.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'POST') !== 'POST') {
    api_error('method_not_allowed', 'Only POST is allowed.', 405);
}

$claims = vip_admin_require_auth();
$payload = vip_admin_request_json();

$id = (int) ($payload['id'] ?? 0);
if ($id <= 0) {
    api_error('invalid_id', 'A valid signup id is required.', 422);
}

$nickname = trim((string) ($payload['nickname'] ?? ''));
$generation = trim((string) ($payload['generation'] ?? ''));
$gender = trim((string) ($payload['gender'] ?? ''));
$location = trim((string) ($payload['location'] ?? ''));
$joinReason = trim((string) ($payload['join_reason'] ?? ''));
$introText = trim((string) ($payload['intro_text'] ?? ''));
$contactTypeRaw = trim((string) ($payload['contact_type'] ?? ''));
$contactInfoRaw = trim((string) ($payload['contact_info'] ?? ''));
$contactQrcodePathRaw = trim((string) ($payload['contact_qrcode_path'] ?? ''));
$isApproved = filter_var($payload['is_approved'] ?? false, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);

if ($nickname === '' || $generation === '' || $gender === '' || $location === '' || $joinReason === '' || $introText === '' || $isApproved === null) {
    api_error('missing_fields', 'Please fill out all required fields.', 422);
}

if (!in_array($generation, ['70', '80', '90', '00'], true)) {
    api_error('invalid_generation', 'Generation must be one of 70, 80, 90, or 00.', 422);
}

if (!in_array($gender, ['m', 'f'], true)) {
    api_error('invalid_gender', 'Gender must be m or f.', 422);
}

if (mb_strlen($introText) < 40 || mb_strlen($introText) > 2000) {
    api_error('invalid_intro', 'Intro text must be between 40 and 2000 characters.', 422);
}

$contactType = $contactTypeRaw === '' ? null : $contactTypeRaw;
if ($contactType !== null && !in_array($contactType, ['wechat', 'phone', 'email', 'qrcode'], true)) {
    api_error('invalid_contact_type', 'Contact type is invalid.', 422);
}

$contactInfo = $contactInfoRaw !== '' ? $contactInfoRaw : null;
$contactQrcodePath = $contactQrcodePathRaw !== '' ? ltrim($contactQrcodePathRaw, '/') : null;

if ($contactType === null) {
    $contactInfo = null;
    $contactQrcodePath = null;
}

if ($contactType === 'qrcode') {
    $contactInfo = null;
    if ($contactQrcodePath === null) {
        api_error('missing_qrcode', 'QR code path is required when contact type is qrcode.', 422);
    }
}

if ($contactType !== null && $contactType !== 'qrcode' && $contactInfo === null) {
    api_error('missing_contact_info', 'Contact info is required for the selected contact type.', 422);
}

try {
    $pdo = db();

    $existingStatement = $pdo->prepare('SELECT is_approved, is_read FROM vips WHERE id = :id AND is_deleted = 0 LIMIT 1');
    $existingStatement->execute([':id' => $id]);
    $existingRow = $existingStatement->fetch();

    if (!is_array($existingRow)) {
        api_error('not_found', 'Signup not found.', 404);
    }

    $previousApproval = (int) ($existingRow['is_approved'] ?? 0) === 1;
    $currentRead = (int) ($existingRow['is_read'] ?? 0) === 1;
    $actorLabel = (string) ($claims['_actor_label'] ?? $claims['sub'] ?? 'admin');

    $approvedBy = null;
    $approvedAt = null;

    if ($isApproved) {
        $approvedBy = $actorLabel;
        $approvedAt = date('Y-m-d H:i:s');
    }

    if ($isApproved && $previousApproval) {
        $approvalInfoStatement = $pdo->prepare('SELECT approved_by, approved_at FROM vips WHERE id = :id LIMIT 1');
        $approvalInfoStatement->execute([':id' => $id]);
        $approvalInfo = $approvalInfoStatement->fetch();
        if (is_array($approvalInfo)) {
            $approvedBy = (string) ($approvalInfo['approved_by'] ?? $approvedBy);
            $approvedAt = (string) ($approvalInfo['approved_at'] ?? $approvedAt);
        }
    }

    $statement = $pdo->prepare(
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
            is_read = :is_read,
            is_approved = :is_approved,
            approved_by = :approved_by,
            approved_at = :approved_at
        WHERE id = :id'
    );

    $statement->execute([
        ':id' => $id,
        ':nickname' => $nickname,
        ':generation' => $generation,
        ':gender' => $gender,
        ':location' => $location,
        ':join_reason' => $joinReason,
        ':intro_text' => $introText,
        ':contact_type' => $contactType,
        ':contact_info' => $contactInfo,
        ':contact_qrcode_path' => $contactQrcodePath,
        ':is_read' => $currentRead ? 1 : 0,
        ':is_approved' => $isApproved ? 1 : 0,
        ':approved_by' => $approvedBy,
        ':approved_at' => $approvedAt,
    ]);

    api_ok([
        'id' => $id,
        'updated' => true,
        'approved' => $isApproved,
    ], 'VIP signup updated.');
} catch (Throwable $throwable) {
    api_error('server_error', 'Unable to update this signup right now.', 500);
}
