<?php
declare(strict_types=1);

require_once ROOT_PATH . 'api/_vip_admin_auth.php';

$publishableKey = vip_admin_get_publishable_key();
$vipId = (int) ($_GET['id'] ?? 0);

if ($vipId <= 0) {
    http_response_code(404);
    require ROOT_PATH . 'pages/404.php';
    exit;
}
?>
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>VIP Admin - VIP #<?php echo $vipId; ?></title>
  <link rel="stylesheet" href="/assets/style.css">
  <link rel="stylesheet" href="/pages/vip/admin/style.css">
</head>
<body>
  <main
    class="vip-admin-page"
    data-vip-admin-vip
    data-admin-view="dashboard"
    data-admin-vip-id="<?php echo $vipId; ?>"
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
        <h1>VIP #<?php echo $vipId; ?></h1>
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
          <p data-forbidden-message>Your account is not on the VIP admin whitelist.</p>
        </div>
        <div class="state-actions">
          <a href="/vip/admin/vips/" class="ghost-button">返回列表</a>
          <button type="button" class="ghost-button" data-admin-signout>退出并切换账号</button>
          <button type="button" class="primary-button" data-admin-retry>重新验证</button>
        </div>
      </div>

      <div class="dashboard dashboard-detail is-hidden" data-dashboard>
        <button
          type="button"
          class="admin-drawer-backdrop"
          data-admin-drawer-backdrop
          aria-label="关闭菜单"
        ></button>

        <aside class="admin-nav" data-admin-drawer>
          <div class="admin-nav-top">
            <div>
              <p class="state-kicker">Navigation</p>
              <h2>Admin Menu</h2>
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
            <button type="button" class="admin-nav-link is-disabled" disabled>
              <span class="admin-nav-link-label">Users Management</span>
              <span class="admin-nav-link-meta">Coming soon</span>
            </button>
            <a href="/vip/admin/vips/" class="admin-nav-link is-active" aria-current="page">
              <span class="admin-nav-link-label">Vips</span>
              <span class="admin-nav-link-meta">Review applications</span>
            </a>
          </nav>
        </aside>

        <section class="editor-panel editor-panel--full">
          <form class="editor-card" data-admin-form>
            <div class="editor-top">
              <div>
                <p class="state-kicker">Editor</p>
                <a href="/vip/admin/vips/" class="editor-back-link">返回 Vips 列表</a>
                <h2 data-editor-title>加载中...</h2>
              </div>
              <div class="editor-actions">
                <label class="toggle-pill">
                  <input type="checkbox" name="is_approved" data-admin-approve-toggle>
                  <span>审核通过</span>
                </label>
                <button type="submit" class="primary-button" data-admin-save disabled>保存修改</button>
              </div>
            </div>

            <div class="editor-grid">
              <label class="field">
                <span>昵称</span>
                <input type="text" name="nickname" required disabled>
              </label>
              <label class="field">
                <span>出生年代</span>
                <select name="generation" required disabled>
                  <option value="70">70后</option>
                  <option value="80">80后</option>
                  <option value="90">90后</option>
                  <option value="00">00后</option>
                </select>
              </label>
              <label class="field">
                <span>性别</span>
                <select name="gender" required disabled>
                  <option value="m">男生</option>
                  <option value="f">女生</option>
                </select>
              </label>
              <label class="field">
                <span>所在地</span>
                <input type="text" name="location" required disabled>
              </label>
              <label class="field">
                <span>加入原因</span>
                <input type="text" name="join_reason" required disabled>
              </label>
              <label class="field">
                <span>联系方式类型</span>
                <select name="contact_type" disabled>
                  <option value="">不公开</option>
                  <option value="wechat">微信</option>
                  <option value="phone">电话</option>
                  <option value="email">邮箱</option>
                  <option value="qrcode">二维码</option>
                </select>
              </label>
              <label class="field" data-contact-info-field>
                <span>联系方式内容</span>
                <input type="text" name="contact_info" disabled>
              </label>
              <label class="field" data-qrcode-path-field>
                <span>二维码路径</span>
                <input type="text" name="contact_qrcode_path" disabled>
              </label>
            </div>

            <label class="field">
              <span>自我介绍</span>
              <textarea name="intro_text" rows="8" required disabled></textarea>
            </label>

            <div class="qrcode-preview-card is-hidden" data-qrcode-preview-card>
              <p class="preview-title">二维码预览</p>
              <img src="" alt="二维码预览" data-qrcode-preview-image>
            </div>

            <div class="meta-grid">
              <div class="meta-card">
                <span class="meta-label">创建时间</span>
                <strong data-meta-created>--</strong>
              </div>
              <div class="meta-card">
                <span class="meta-label">最后更新</span>
                <strong data-meta-updated>--</strong>
              </div>
              <div class="meta-card">
                <span class="meta-label">审核人</span>
                <strong data-meta-approved-by>--</strong>
              </div>
              <div class="meta-card">
                <span class="meta-label">审核时间</span>
                <strong data-meta-approved-at>--</strong>
              </div>
              <div class="meta-card">
                <span class="meta-label">IP 归属地</span>
                <strong data-meta-ip-location>--</strong>
              </div>
              <div class="meta-card">
                <span class="meta-label">设备信息</span>
                <strong data-meta-device>--</strong>
              </div>
            </div>

            <p class="form-feedback" data-form-feedback></p>
          </form>
        </section>
      </div>
    </section>
  </main>
  <script src="/pages/vip/admin/auth.js" defer></script>
  <script src="/pages/vip/admin/vip/script.js" defer></script>
</body>
</html>
