<?php
declare(strict_types=1);

require_once ROOT_PATH . 'api/_vip_admin_auth.php';

$publishableKey = vip_admin_get_publishable_key();
$adminNavCurrent = 'vips';
?>
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>VIP Admin - Vips</title>
  <link rel="stylesheet" href="/assets/style.css">
  <link rel="stylesheet" href="/pages/vip/admin/style.css">
</head>
<body>
  <main
    class="vip-admin-page"
    data-vip-admin-vips
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
        <h1>Vips</h1>
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
          <button type="button" class="ghost-button" data-admin-signout>退出并切换账号</button>
          <button type="button" class="primary-button" data-admin-retry>重新验证</button>
        </div>
      </div>

      <div class="dashboard dashboard-list is-hidden" data-dashboard>
        <button
          type="button"
          class="admin-drawer-backdrop"
          data-admin-drawer-backdrop
          aria-label="关闭菜单"
        ></button>

        <?php require ROOT_PATH . 'pages/vip/admin/_partials/sidebar.php'; ?>

        <section class="signup-sidebar signup-sidebar--full">
          <div class="sidebar-top">
            <div>
              <p class="state-kicker">Signups</p>
              <h2>报名列表</h2>
            </div>
            <div class="sidebar-top-actions">
              <button type="button" class="refresh-icon-button" data-admin-refresh aria-label="刷新列表" title="刷新列表">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M20 12a8 8 0 1 1-2.34-5.66" />
                  <path d="M20 4v6h-6" />
                </svg>
              </button>
            </div>
          </div>

          <div class="sidebar-stats" data-admin-counts>
            <span>全部 0</span>
            <span>待审核 0</span>
            <span>已审核 0</span>
          </div>

          <div class="toolbar-actions">
            <button
              type="button"
              class="ghost-button admin-bulk-read-button is-hidden"
              data-admin-mark-all-read
            >全部标记为已读</button>
          </div>

          <form class="toolbar" data-admin-search-form>
            <label class="field">
              <span>搜索</span>
              <input type="search" placeholder="昵称或编号" data-admin-search>
            </label>
            <div class="toolbar-actions">
              <button type="submit" class="refresh-icon-button" aria-label="搜索" title="搜索">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="11" cy="11" r="6" />
                  <path d="M20 20l-4.2-4.2" />
                </svg>
              </button>
            </div>
          </form>

          <div class="pagination-bar" data-pagination-top></div>
          <div class="signup-list" data-signup-list></div>
          <div class="pagination-bar" data-pagination></div>
          <p class="list-feedback" data-list-feedback></p>
        </section>
      </div>
    </section>
  </main>
  <script src="/pages/vip/admin/auth.js" defer></script>
  <script src="/pages/vip/admin/vips/script.js" defer></script>
</body>
</html>
