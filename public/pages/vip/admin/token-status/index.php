<?php
declare(strict_types=1);

require_once ROOT_PATH . 'api/_vip_admin_auth.php';

$publishableKey = vip_admin_get_publishable_key();
$adminNavCurrent = 'token-status';
$authScriptVersion = (string) @filemtime(ROOT_PATH . 'pages/vip/admin/auth.js');
$pageScriptVersion = (string) @filemtime(ROOT_PATH . 'pages/vip/admin/token-status/script.js');
?>
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>VIP Admin - Token Status</title>
  <link rel="stylesheet" href="/assets/style.css">
  <link rel="stylesheet" href="/pages/vip/admin/style.css">
</head>
<body>
  <main
    class="vip-admin-page"
    data-vip-admin-token-status
    data-admin-view="dashboard"
    data-clerk-publishable-key="<?php echo htmlspecialchars($publishableKey, ENT_QUOTES, 'UTF-8'); ?>"
  >
    <div class="admin-loading-overlay is-hidden" data-admin-loading-overlay aria-hidden="true">
      <div class="admin-loading-spinner" aria-hidden="true"></div>
      <p class="admin-loading-reason" data-admin-loading-reason>正在处理中...</p>
    </div>

    <section class="admin-topbar">
      <div class="admin-topbar-copy">
        <button
          type="button"
          class="admin-menu-button"
          data-admin-drawer-toggle
          aria-label="打开菜单"
          aria-expanded="false"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
        <p class="eyebrow">VIP ADMIN</p>
        <h1>Token Status</h1>
      </div>
      <div class="admin-topbar-actions">
        <button type="button" class="ghost-button" data-admin-signout hidden>退出登录</button>
      </div>
    </section>

    <section class="admin-shell">
      <div class="admin-state-card admin-state-card--forbidden is-hidden" data-forbidden-state>
        <div class="admin-state-icon" aria-hidden="true">!</div>
        <div class="state-copy">
          <p class="state-kicker">VIP Admin</p>
          <h2 data-forbidden-title>Access denied</h2>
          <p data-forbidden-message>Your account does not have access to this page.</p>
        </div>
        <div class="state-actions">
          <a href="/vip/admin/vips/" class="ghost-button">返回 Vips</a>
          <button type="button" class="ghost-button" data-admin-signout>退出并切换账号</button>
          <button type="button" class="primary-button" data-admin-retry>重新验证</button>
        </div>
      </div>

      <div class="dashboard dashboard-users is-hidden" data-dashboard>
        <button
          type="button"
          class="admin-drawer-backdrop"
          data-admin-drawer-backdrop
          aria-label="关闭菜单"
        ></button>

        <?php require ROOT_PATH . 'pages/vip/admin/_partials/sidebar.php'; ?>

        <section class="editor-panel editor-panel--full">
          <div class="editor-card token-status-card">
            <div class="token-status-actions">
              <button type="button" class="ghost-button" data-admin-token-refresh>刷新 token</button>
            </div>

            <p class="list-feedback" data-token-feedback></p>

            <div class="token-status-grid">
              <article class="token-status-item">
                <p class="token-status-label">Session status</p>
                <p class="token-status-value" data-token-session-status>checking...</p>
              </article>
              <article class="token-status-item">
                <p class="token-status-label">Current time</p>
                <p class="token-status-value" data-token-now>--</p>
              </article>
              <article class="token-status-item">
                <p class="token-status-label">Issued at</p>
                <p class="token-status-value" data-token-issued-at>--</p>
              </article>
              <article class="token-status-item">
                <p class="token-status-label">Expires at</p>
                <p class="token-status-value" data-token-expires-at>--</p>
              </article>
              <article class="token-status-item">
                <p class="token-status-label">Remaining</p>
                <p class="token-status-value" data-token-remaining>--</p>
              </article>
              <article class="token-status-item">
                <p class="token-status-label">Lifetime</p>
                <p class="token-status-value" data-token-lifetime>--</p>
              </article>
            </div>

            <div class="token-status-block">
              <p class="token-status-label">Token preview</p>
              <pre class="token-status-pre" data-token-preview>--</pre>
            </div>

            <div class="token-status-block">
              <p class="token-status-label">Decoded claims</p>
              <pre class="token-status-pre" data-token-claims>--</pre>
            </div>
          </div>
        </section>
      </div>
    </section>
  </main>
  <script src="/pages/vip/admin/auth.js?v=<?php echo urlencode($authScriptVersion); ?>" defer></script>
  <script src="/pages/vip/admin/token-status/script.js?v=<?php echo urlencode($pageScriptVersion); ?>" defer></script>
</body>
</html>
