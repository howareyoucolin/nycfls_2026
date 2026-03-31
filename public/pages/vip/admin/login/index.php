<?php
declare(strict_types=1);

require_once ROOT_PATH . 'api/_vip_admin_auth.php';

$publishableKey = vip_admin_get_publishable_key();
?>
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>VIP Admin Login</title>
  <link rel="stylesheet" href="/assets/style.css">
  <link rel="stylesheet" href="/pages/vip/admin/style.css">
</head>
<body>
  <main
    class="vip-admin-page vip-admin-login-page"
    data-vip-admin-login
    data-clerk-publishable-key="<?php echo htmlspecialchars($publishableKey, ENT_QUOTES, 'UTF-8'); ?>"
  >
    <section class="admin-login-shell">
      <div class="login-page-intro">
        <p class="eyebrow">VIP ADMIN</p>
        <h1>后台登录</h1>
        <p class="login-lead">使用管理员账号登录后进入报名管理后台。</p>
      </div>
        <div class="signin-root login-signin-root" id="clerk-signin"></div>
        <p class="state-footnote" data-login-feedback>正在加载 Clerk 登录组件...</p>

    </section>
  </main>
  <script src="/pages/vip/admin/login/script.js" defer></script>
</body>
</html>
