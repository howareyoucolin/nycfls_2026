<?php
declare(strict_types=1);

require_once ROOT_PATH . 'api/_vip_admin_auth.php';

$publishableKey = vip_admin_get_publishable_key();
$adminNavCurrent = 'users';
?>
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>VIP Admin - 用户管理</title>
  <link rel="stylesheet" href="/assets/style.css">
  <link rel="stylesheet" href="/pages/vip/admin/style.css">
</head>
<body>
  <main
    class="vip-admin-page"
    data-vip-admin-users
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
        <h1>用户管理</h1>
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
          <p data-forbidden-message>你的账号没有权限访问这个页面。</p>
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
          <div class="editor-card users-card">
            <div class="editor-top">
              <div>
                <p class="state-kicker">白名单</p>
                <h2>管理员用户</h2>
              </div>
            </div>

            <form class="toolbar toolbar-users" data-user-form>
              <label class="field">
                <span>邮箱</span>
                <input type="email" name="email" placeholder="name@example.com" required>
              </label>
              <label class="field">
                <span>角色</span>
                <select name="role">
                  <option value="manager" selected>管理人员</option>
                  <option value="admin">超级管理人员</option>
                </select>
              </label>
              <div class="toolbar-actions">
                <button type="submit" class="primary-button" data-user-save>保存用户</button>
              </div>
            </form>

            <p class="list-feedback" data-user-feedback></p>
            <div class="users-list" data-users-list></div>
          </div>
        </section>
      </div>
    </section>

    <div class="admin-confirm-modal is-hidden" data-user-remove-modal aria-hidden="true">
      <button
        type="button"
        class="admin-confirm-backdrop"
        data-user-remove-cancel
        aria-label="关闭确认弹窗"
      ></button>
      <div class="admin-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="user-remove-title">
        <p class="state-kicker">确认操作</p>
        <h2 id="user-remove-title">确认移除用户？</h2>
        <p class="admin-confirm-copy" data-user-remove-copy>移除后，该账号将无法继续访问后台。</p>
        <div class="admin-confirm-actions">
          <button type="button" class="ghost-button" data-user-remove-cancel>取消</button>
          <button type="button" class="primary-button" data-user-remove-confirm>确认移除</button>
        </div>
      </div>
    </div>
  </main>
  <script src="/pages/vip/admin/auth.js" defer></script>
  <script src="/pages/vip/admin/users/script.js" defer></script>
</body>
</html>
