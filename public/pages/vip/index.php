<?php
declare(strict_types=1);

$page = max(1, (int) ($_GET['page'] ?? 1));
$perPage = 20;
$offset = ($page - 1) * $perPage;

$vipRows = [];
$totalRows = 0;
$loadError = null;

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

function excerpt_text(string $text, int $limit = 40): array
{
    $plainText = trim(preg_replace('/\s+/u', ' ', $text) ?? '');
    $length = mb_strlen($plainText);

    if ($length <= $limit) {
        return [
            'text' => $plainText,
            'is_truncated' => false,
        ];
    }

    return [
        'text' => mb_substr($plainText, 0, $limit) . '...',
        'is_truncated' => true,
    ];
}

try {
    $countStatement = db()->query('SELECT COUNT(*) FROM vips WHERE is_deleted = 0 AND is_approved = 1');
    $totalRows = (int) $countStatement->fetchColumn();

    $listStatement = db()->prepare(
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
            is_deleted,
            is_read,
            is_approved,
            created_at
        FROM vips
        WHERE is_deleted = 0
          AND is_approved = 1
        ORDER BY created_at DESC, id DESC
        LIMIT :limit OFFSET :offset'
    );
    $listStatement->bindValue(':limit', $perPage, PDO::PARAM_INT);
    $listStatement->bindValue(':offset', $offset, PDO::PARAM_INT);
    $listStatement->execute();
    $vipRows = $listStatement->fetchAll();
} catch (Throwable $exception) {
    $loadError = '列表暂时无法加载，请稍后再试。';
}

$totalPages = max(1, (int) ceil($totalRows / $perPage));

$paginationItems = [];
if ($totalPages <= 7) {
    for ($paginationPage = 1; $paginationPage <= $totalPages; $paginationPage++) {
        $paginationItems[] = $paginationPage;
    }
} else {
    $paginationItems = [1];

    if ($page > 3) {
        $paginationItems[] = 'ellipsis';
    }

    $windowStart = max(2, $page - 1);
    $windowEnd = min($totalPages - 1, $page + 1);

    for ($paginationPage = $windowStart; $paginationPage <= $windowEnd; $paginationPage++) {
        $paginationItems[] = $paginationPage;
    }

    if ($page < $totalPages - 2) {
        $paginationItems[] = 'ellipsis';
    }

    $paginationItems[] = $totalPages;
    $paginationItems = array_values(array_unique($paginationItems, SORT_REGULAR));
}
function render_pagination(int $page, int $totalPages, array $paginationItems): void
{
    if ($totalPages <= 1) {
        return;
    }
    ?>
    <nav class="pagination" aria-label="分页">
      <?php if ($page > 1): ?>
        <a class="page-arrow" href="/vip?page=<?php echo $page - 1; ?>" aria-label="上一页">‹</a>
      <?php else: ?>
        <span class="page-arrow is-disabled" aria-hidden="true">‹</span>
      <?php endif; ?>

      <div class="page-numbers">
        <?php foreach ($paginationItems as $paginationItem): ?>
          <?php if ($paginationItem === 'ellipsis'): ?>
            <span class="page-ellipsis">…</span>
          <?php elseif ((int) $paginationItem === $page): ?>
            <span class="page-number is-current"><?php echo $paginationItem; ?></span>
          <?php else: ?>
            <a class="page-number" href="/vip?page=<?php echo $paginationItem; ?>"><?php echo $paginationItem; ?></a>
          <?php endif; ?>
        <?php endforeach; ?>
      </div>

      <?php if ($page < $totalPages): ?>
        <a class="page-arrow" href="/vip?page=<?php echo $page + 1; ?>" aria-label="下一页">›</a>
      <?php else: ?>
        <span class="page-arrow is-disabled" aria-hidden="true">›</span>
      <?php endif; ?>
    </nav>
    <?php
}
?>
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>群成员列表</title>
  <link rel="stylesheet" href="/assets/style.css">
  <link rel="stylesheet" href="/pages/vip/_templates/nav.css">
  <link rel="stylesheet" href="/pages/vip/style.css">
</head>
<body>
  <main class="vip-page">
    <?php require __DIR__ . '/_templates/nav.php'; ?>
    <section class="hero">
      <p class="eyebrow">VIP DIRECTORY</p>
      <h1>群成员列表</h1>
      <p class="hero-copy">这里汇总了目前已提交的群成员资料，你可以轻松翻页浏览，快速认识更多人。</p>
    </section>

    <?php if ($loadError !== null): ?>
      <section class="state-card">
        <p><?php echo htmlspecialchars($loadError, ENT_QUOTES, 'UTF-8'); ?></p>
      </section>
    <?php elseif ($totalRows === 0): ?>
      <section class="state-card">
        <p>目前还没有群成员资料，等第一位用户提交后，这里就会显示列表。</p>
      </section>
    <?php else: ?>
      <section class="summary-bar">
        <span>共 <?php echo $totalRows; ?> 位</span>
        <span>第 <?php echo min($page, $totalPages); ?> / <?php echo $totalPages; ?> 页</span>
      </section>

      <?php render_pagination($page, $totalPages, $paginationItems); ?>

      <section class="vip-grid">
        <?php foreach ($vipRows as $vip): ?>
          <?php $introExcerpt = excerpt_text((string) $vip['intro_text'], 75); ?>
          <article class="vip-card">
            <div class="card-top">
              <div>
                <p class="card-id">#<?php echo (int) $vip['id']; ?></p>
                <h2><?php echo htmlspecialchars($vip['nickname'], ENT_QUOTES, 'UTF-8'); ?></h2>
                <p class="meta-line">
                  <?php
                  $metaParts = [
                      ($vip['generation'] !== '' ? $vip['generation'] . '后' : ''),
                      $genderLabels[$vip['gender']] ?? $vip['gender'],
                      $vip['location'],
                      $vip['join_reason'],
                  ];
                  echo htmlspecialchars(implode(' · ', array_filter($metaParts)), ENT_QUOTES, 'UTF-8');
                  ?>
                </p>
              </div>
            </div>

            <p class="joined-date">
              加入时间：<?php echo htmlspecialchars(date('Y-m-d', strtotime((string) $vip['created_at'])), ENT_QUOTES, 'UTF-8'); ?>
            </p>

            <div class="intro-block">
              <p
                class="intro-text"
                data-intro-text
                data-collapsed-text="<?php echo htmlspecialchars($introExcerpt['text'], ENT_QUOTES, 'UTF-8'); ?>"
                data-full-text="<?php echo htmlspecialchars((string) $vip['intro_text'], ENT_QUOTES, 'UTF-8'); ?>"
              ><?php echo nl2br(htmlspecialchars($introExcerpt['text'], ENT_QUOTES, 'UTF-8')); ?></p>
              <?php if ($introExcerpt['is_truncated']): ?>
                <button type="button" class="intro-toggle" data-intro-toggle data-expanded="false">查看全部</button>
              <?php endif; ?>
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
        <?php endforeach; ?>
      </section>

      <?php render_pagination($page, $totalPages, $paginationItems); ?>
    <?php endif; ?>
  </main>
  <script src="/pages/vip/script.js" defer></script>
</body>
</html>
