<?php
declare(strict_types=1);

$adminNavCurrent = isset($adminNavCurrent) ? (string) $adminNavCurrent : 'vips';
?>
<aside class="admin-nav" data-admin-drawer>
  <div class="admin-nav-top">
    <div>
      <p class="state-kicker">导航</p>
      <h2>管理菜单</h2>
      <p class="admin-nav-session" data-admin-session-email>logged in as ...</p>
    </div>
    <button
      type="button"
      class="drawer-close-button"
      data-admin-drawer-close
      aria-label="关闭菜单"
    >
      <span></span>
      <span></span>
    </button>
  </div>
  <nav class="admin-nav-links" aria-label="VIP Admin Navigation">
    <a
      href="/vip/admin/users/"
      class="admin-nav-link<?php echo $adminNavCurrent === 'users' ? ' is-active' : ''; ?>"
      <?php echo $adminNavCurrent === 'users' ? ' aria-current="page"' : ''; ?>
      data-admin-users-link
    >
      <span class="admin-nav-link-label">用户管理</span>
      <span class="admin-nav-link-meta">管理账号角色</span>
    </a>
    <a
      href="/vip/admin/debug/"
      class="admin-nav-link<?php echo $adminNavCurrent === 'debug' ? ' is-active' : ''; ?>"
      <?php echo $adminNavCurrent === 'debug' ? ' aria-current="page"' : ''; ?>
      data-admin-debug-link
    >
      <span class="admin-nav-link-label">Debug Log</span>
      <span class="admin-nav-link-meta">查看最近调试日志</span>
    </a>
    <a
      href="/vip/admin/token-status/"
      class="admin-nav-link<?php echo $adminNavCurrent === 'token-status' ? ' is-active' : ''; ?>"
      <?php echo $adminNavCurrent === 'token-status' ? ' aria-current="page"' : ''; ?>
    >
      <span class="admin-nav-link-label">Token Status</span>
      <span class="admin-nav-link-meta">查看当前 Clerk token 状态</span>
    </a>
    <a
      href="/vip/admin/vips/"
      class="admin-nav-link<?php echo $adminNavCurrent === 'vips' || $adminNavCurrent === 'vip' ? ' is-active' : ''; ?>"
      <?php echo $adminNavCurrent === 'vips' || $adminNavCurrent === 'vip' ? ' aria-current="page"' : ''; ?>
    >
      <span class="admin-nav-link-label">Vips</span>
      <span class="admin-nav-link-meta">审核报名资料</span>
    </a>
  </nav>
</aside>
