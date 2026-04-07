<?php
declare(strict_types=1);

$page = max(1, (int) ($_GET['page'] ?? 1));
$perPage = 20;
$offset = ($page - 1) * $perPage;
$search = trim((string) ($_GET['search'] ?? ''));
$searchTerm = $search !== '' ? '%' . $search . '%' : null;

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
    $whereParts = [
        'is_deleted = 0',
        'is_approved = 1',
    ];
    $params = [];

    if ($searchTerm !== null) {
        if (ctype_digit($search)) {
            $whereParts[] = '(nickname LIKE :search OR CAST(id AS CHAR) = :search_id)';
            $params[':search_id'] = $search;
        } else {
            $whereParts[] = 'nickname LIKE :search';
        }
        $params[':search'] = $searchTerm;
    }

    $whereSql = 'WHERE ' . implode(' AND ', $whereParts);

    $countStatement = db()->prepare('SELECT COUNT(*) FROM vips ' . $whereSql);
    foreach ($params as $key => $value) {
        $countStatement->bindValue($key, $value);
    }
    $countStatement->execute();
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
        ' . $whereSql . '
        ORDER BY created_at DESC, id DESC
        LIMIT :limit OFFSET :offset'
    );
    foreach ($params as $key => $value) {
        $listStatement->bindValue($key, $value);
    }
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
function vip_page_query(array $overrides = []): string
{
    $params = [];
    $search = trim((string) ($_GET['search'] ?? ''));
    $page = max(1, (int) ($_GET['page'] ?? 1));

    if ($search !== '') {
        $params['search'] = $search;
    }

    if ($page > 1) {
        $params['page'] = (string) $page;
    }

    foreach ($overrides as $key => $value) {
        if ($value === null || $value === '' || ($key === 'page' && (int) $value <= 1)) {
            unset($params[$key]);
            continue;
        }

        $params[$key] = (string) $value;
    }

    $query = http_build_query($params);
    return $query !== '' ? ('?' . $query) : '';
}

function render_pagination(int $page, int $totalPages, array $paginationItems): void
{
    if ($totalPages <= 1) {
        return;
    }
    ?>
    <nav class="pagination" aria-label="分页">
      <?php if ($page > 1): ?>
        <a class="page-arrow" href="/vip<?php echo htmlspecialchars(vip_page_query(['page' => $page - 1]), ENT_QUOTES, 'UTF-8'); ?>" aria-label="上一页">‹</a>
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
            <a class="page-number" href="/vip<?php echo htmlspecialchars(vip_page_query(['page' => (int) $paginationItem]), ENT_QUOTES, 'UTF-8'); ?>"><?php echo $paginationItem; ?></a>
          <?php endif; ?>
        <?php endforeach; ?>
      </div>

      <?php if ($page < $totalPages): ?>
        <a class="page-arrow" href="/vip<?php echo htmlspecialchars(vip_page_query(['page' => $page + 1]), ENT_QUOTES, 'UTF-8'); ?>" aria-label="下一页">›</a>
      <?php else: ?>
        <span class="page-arrow is-disabled" aria-hidden="true">›</span>
      <?php endif; ?>
    </nav>
    <?php
}

function vip_public_origin(): string
{
    $scheme = 'http';
    $https = strtolower((string) ($_SERVER['HTTPS'] ?? ''));
    if ($https !== '' && $https !== 'off') {
        $scheme = 'https';
    } elseif (strtolower(trim((string) ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? ''))) === 'https') {
        $scheme = 'https';
    }

    $host = trim((string) ($_SERVER['HTTP_HOST'] ?? ''));
    return $host !== '' ? ($scheme . '://' . $host) : '';
}
?>
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>群成员列表</title>
  <link rel="stylesheet" href="/assets/style.css?v=2">
  <link rel="stylesheet" href="/pages/vip/_templates/nav.css?v=2">
  <link rel="stylesheet" href="/pages/vip/style.css?v=2">
</head>
<body>
  <main class="vip-page">
    <?php require __DIR__ . '/_templates/nav.php'; ?>
    <section class="hero">
      <p class="eyebrow">VIP DIRECTORY</p>
      <h1>群成员列表</h1>
      <p class="hero-copy">这里汇总了目前已提交的群成员资料，你可以轻松翻页浏览，快速认识更多人。</p>
    </section>

    <form class="vip-search-form" method="get" action="/vip">
      <label class="vip-search-field">
        <span>搜索</span>
        <input type="search" name="search" value="<?php echo htmlspecialchars($search, ENT_QUOTES, 'UTF-8'); ?>" placeholder="昵称或编号">
      </label>
      <button type="submit" class="vip-search-button" aria-label="搜索" title="搜索">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="11" cy="11" r="6"></circle>
          <path d="M20 20l-4.2-4.2"></path>
        </svg>
      </button>
    </form>

    <?php if ($loadError !== null): ?>
      <section class="state-card">
        <p><?php echo htmlspecialchars($loadError, ENT_QUOTES, 'UTF-8'); ?></p>
      </section>
    <?php elseif ($totalRows === 0): ?>
      <section class="state-card">
        <p>
          <?php if ($search !== ''): ?>
            没有找到符合“<?php echo htmlspecialchars($search, ENT_QUOTES, 'UTF-8'); ?>”的群成员资料。
          <?php else: ?>
            目前还没有群成员资料，等第一位用户提交后，这里就会显示列表。
          <?php endif; ?>
        </p>
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
          <?php
          $metaParts = [
              ($vip['generation'] !== '' ? $vip['generation'] . '后' : ''),
              $genderLabels[$vip['gender']] ?? $vip['gender'],
              $vip['location'],
              $vip['join_reason'],
          ];
          $metaLine = implode(' · ', array_filter($metaParts));
          $memberPath = '/vip/member/' . (int) $vip['id'];
          $memberUrl = vip_public_origin() . $memberPath;
          $contactLine = '';
          if (!empty($vip['contact_type'])) {
              $contactTypeLabel = $contactTypeLabels[$vip['contact_type']] ?? $vip['contact_type'];
              if ($vip['contact_type'] === 'qrcode') {
                  $contactLine = '联系方式：二维码，请打开详情查看';
              } else {
                  $contactLine = '联系方式：' . $contactTypeLabel . '：' . (string) $vip['contact_info'];
              }
          }
          $copyParagraph = implode("\n", array_filter([
              'VIP #' . (int) $vip['id'] . ' ' . (string) $vip['nickname'],
              $metaLine !== '' ? ('资料：' . $metaLine) : '',
              '自我介绍：' . trim((string) $vip['intro_text']),
              $contactLine,
              '详情链接：' . $memberUrl,
          ]));
          ?>
          <article class="vip-card">
            <div class="card-top">
              <div>
                <p class="card-id">#<?php echo (int) $vip['id']; ?></p>
                <h2><?php echo htmlspecialchars($vip['nickname'], ENT_QUOTES, 'UTF-8'); ?></h2>
                <p class="meta-line">
                  <?php echo htmlspecialchars($metaLine, ENT_QUOTES, 'UTF-8'); ?>
                </p>
              </div>
              <div class="card-actions">
                <a
                  href="<?php echo htmlspecialchars($memberPath, ENT_QUOTES, 'UTF-8'); ?>"
                  class="card-icon-button"
                  aria-label="打开成员详情"
                  title="打开成员详情"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M14 5h5v5"></path>
                    <path d="M10 14 19 5"></path>
                    <path d="M19 14v4a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h4"></path>
                  </svg>
                </a>
                <button
                  type="button"
                  class="card-icon-button"
                  data-copy-card
                  data-copy-text="<?php echo htmlspecialchars($copyParagraph, ENT_QUOTES, 'UTF-8'); ?>"
                  aria-label="复制会员文案"
                  title="复制会员文案"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <rect x="9" y="9" width="10" height="10" rx="2"></rect>
                    <path d="M7 15H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v1"></path>
                  </svg>
                </button>
                <button
                  type="button"
                  class="card-icon-button"
                  data-copy-link
                  data-copy-link-value="<?php echo htmlspecialchars($memberUrl, ENT_QUOTES, 'UTF-8'); ?>"
                  aria-label="复制详情链接"
                  title="复制详情链接"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M10 13a5 5 0 0 0 7.07 0l2.12-2.12a5 5 0 1 0-7.07-7.07L10.9 5"></path>
                    <path d="M14 11a5 5 0 0 0-7.07 0L4.81 13.12a5 5 0 0 0 7.07 7.07L13.1 19"></path>
                  </svg>
                </button>
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

  <div class="vip-copy-modal is-hidden" data-copy-modal aria-hidden="true">
    <button
      type="button"
      class="vip-copy-modal-backdrop"
      data-copy-modal-close
      aria-label="关闭提示"
    ></button>
    <div class="vip-copy-dialog" role="dialog" aria-modal="true" aria-labelledby="vip-copy-modal-title">
      <p class="eyebrow">VIP DIRECTORY</p>
      <h2 id="vip-copy-modal-title" data-copy-modal-title>已复制</h2>
      <p class="vip-copy-modal-text" data-copy-modal-text>内容已复制。</p>
      <div class="vip-copy-modal-actions">
        <button type="button" class="vip-search-button vip-copy-confirm" data-copy-modal-close>知道了</button>
      </div>
    </div>
  </div>
  <script src="/pages/vip/script.js?v=2" defer></script>
</body>
</html>
