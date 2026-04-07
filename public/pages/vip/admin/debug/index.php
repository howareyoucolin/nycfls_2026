<?php
declare(strict_types=1);

require_once ROOT_PATH . 'api/_vip_admin_auth.php';

$publishableKey = vip_admin_get_publishable_key();
$adminNavCurrent = 'debug';
?>
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>VIP Admin - Debug Log</title>
  <link rel="stylesheet" href="/assets/style.css?v=2">
  <link rel="stylesheet" href="/pages/vip/admin/style.css?v=2">
</head>
<body>
  <main
    class="vip-admin-page"
    data-vip-admin-debug
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
        <h1>Debug Log</h1>
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
          <h2 data-forbidden-title>无权访问</h2>
          <p data-forbidden-message>只有管理员可以访问调试日志页面。</p>
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
          <div class="editor-card debug-card">
            <div class="editor-top">
              <div>
                <p class="state-kicker">Debug</p>
                <h2>最近日志</h2>
              </div>
            </div>

            <p class="list-feedback" data-debug-feedback></p>
            <div class="debug-log-list" data-debug-log-list></div>
          </div>
        </section>
      </div>
    </section>
  </main>
  <script src="/pages/vip/admin/auth.js?v=2" defer></script>
  <script src="/pages/vip/admin/debug/script.js?v=2" defer></script>
</body>
</html>
