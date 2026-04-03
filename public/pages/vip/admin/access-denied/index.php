<?php
declare(strict_types=1);

require_once ROOT_PATH . 'api/_vip_admin_auth.php';

$publishableKey = vip_admin_get_publishable_key();
$authScriptVersion = (string) @filemtime(ROOT_PATH . 'pages/vip/admin/auth.js');
$pageScriptVersion = (string) @filemtime(ROOT_PATH . 'pages/vip/admin/access-denied/script.js');
?>
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>VIP Admin Access Denied</title>
  <link rel="stylesheet" href="/assets/style.css">
  <link rel="stylesheet" href="/pages/vip/admin/style.css">
</head>
<body>
  <main
    class="vip-admin-page vip-admin-login-page"
    data-vip-admin-access-denied
    data-clerk-publishable-key="<?php echo htmlspecialchars($publishableKey, ENT_QUOTES, 'UTF-8'); ?>"
  >
    <section class="admin-login-shell">
      <div class="login-page-intro">
        <p class="eyebrow">VIP ADMIN</p>
        <h1>Access denied</h1>
        <p class="login-lead">Your account is not in the VIP admin whitelist.</p>
      </div>
      <div class="admin-login-card">
        <div class="login-card-top">
          <span class="login-badge">Whitelist Required</span>
          <p class="state-footnote" data-access-denied-message>Your account is not in the VIP admin whitelist.</p>
          <p class="state-footnote access-denied-contact">If you need access, please contact the site owner.</p>
        </div>
        <div class="state-actions access-denied-actions">
          <button type="button" class="access-denied-signout-button" data-admin-signout>退出并切换账号</button>
        </div>
      </div>
    </section>
  </main>
  <script src="/pages/vip/admin/auth.js?v=<?php echo urlencode($authScriptVersion); ?>" defer></script>
  <script src="/pages/vip/admin/access-denied/script.js?v=<?php echo urlencode($pageScriptVersion); ?>" defer></script>
</body>
</html>
