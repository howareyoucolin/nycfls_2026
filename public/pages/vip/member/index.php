<?php
declare(strict_types=1);

$vipId = (int) ($_GET['id'] ?? 0);
if ($vipId <= 0) {
    http_response_code(404);
    require ROOT_PATH . 'pages/404.php';
    exit;
}

$genderLabels = [
    'm' => '男生',
    'f' => '女生',
];

$contactTypeLabels = [
    'wechat' => '微信',
    'phone' => '电话',
    'email' => '邮箱',
    'qrcode' => '二维码',
];

$vip = null;
$loadError = null;

try {
    $statement = db()->prepare(
        'SELECT
            id,
            nickname,
            generation,
            gender,
            location,
            join_reason,
            intro_text,
            contact_type,
            contact_info,
            contact_qrcode_path,
            created_at
        FROM vips
        WHERE id = :id
          AND is_deleted = 0
          AND is_approved = 1
        LIMIT 1'
    );
    $statement->execute([':id' => $vipId]);
    $vip = $statement->fetch();

    if (!is_array($vip)) {
      http_response_code(404);
      require ROOT_PATH . 'pages/404.php';
      exit;
    }
} catch (Throwable $exception) {
    $loadError = '资料暂时无法加载，请稍后再试。';
}
?>
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><?php echo $vip ? htmlspecialchars((string) $vip['nickname'], ENT_QUOTES, 'UTF-8') . ' · 群成员详情' : '群成员详情'; ?></title>
  <link rel="stylesheet" href="/assets/style.css">
  <link rel="stylesheet" href="/pages/vip/_templates/nav.css">
  <link rel="stylesheet" href="/pages/vip/style.css">
</head>
<body>
  <main class="vip-page">
    <?php require ROOT_PATH . 'pages/vip/_templates/nav.php'; ?>
    <section class="hero">
      <p class="eyebrow">VIP DETAIL</p>
      <h1>成员详情</h1>
      <p class="hero-copy">查看这位群成员的完整资料。</p>
    </section>

    <?php if ($loadError !== null): ?>
      <section class="state-card">
        <p><?php echo htmlspecialchars($loadError, ENT_QUOTES, 'UTF-8'); ?></p>
      </section>
    <?php elseif ($vip !== null): ?>
      <?php
      $metaParts = [
          ($vip['generation'] !== '' ? $vip['generation'] . '后' : ''),
          $genderLabels[$vip['gender']] ?? $vip['gender'],
          $vip['location'],
          $vip['join_reason'],
      ];
      ?>
      <section class="summary-bar">
        <span>VIP #<?php echo (int) $vip['id']; ?></span>
        <a href="/vip" class="page-number">返回列表</a>
      </section>

      <section class="vip-grid vip-grid--single">
        <article class="vip-card">
          <div class="card-top">
            <div>
              <p class="card-id">#<?php echo (int) $vip['id']; ?></p>
              <h2><?php echo htmlspecialchars((string) $vip['nickname'], ENT_QUOTES, 'UTF-8'); ?></h2>
              <p class="meta-line"><?php echo htmlspecialchars(implode(' · ', array_filter($metaParts)), ENT_QUOTES, 'UTF-8'); ?></p>
            </div>
          </div>

          <p class="joined-date">
            加入时间：<?php echo htmlspecialchars(date('Y-m-d', strtotime((string) $vip['created_at'])), ENT_QUOTES, 'UTF-8'); ?>
          </p>

          <div class="intro-block">
            <p class="intro-text"><?php echo nl2br(htmlspecialchars((string) $vip['intro_text'], ENT_QUOTES, 'UTF-8')); ?></p>
          </div>

          <?php if (!empty($vip['contact_type'])): ?>
            <div class="contact-block">
              <p class="contact-label">联系方式</p>
              <?php if ($vip['contact_type'] === 'qrcode' && !empty($vip['contact_qrcode_path'])): ?>
                <div class="qrcode-card">
                  <img
                    src="/<?php echo htmlspecialchars(ltrim((string) $vip['contact_qrcode_path'], '/'), ENT_QUOTES, 'UTF-8'); ?>"
                    alt="二维码"
                    class="qrcode-image"
                  >
                  <span class="qrcode-caption">二维码</span>
                </div>
              <?php else: ?>
                <p class="contact-value">
                  <?php
                  $contactTypeLabel = $contactTypeLabels[$vip['contact_type']] ?? $vip['contact_type'];
                  echo htmlspecialchars($contactTypeLabel . '：' . (string) $vip['contact_info'], ENT_QUOTES, 'UTF-8');
                  ?>
                </p>
              <?php endif; ?>
            </div>
          <?php endif; ?>
        </article>
      </section>
    <?php endif; ?>
  </main>
</body>
</html>
