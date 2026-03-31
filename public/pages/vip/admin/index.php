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
  <title>VIP Admin</title>
  <link rel="stylesheet" href="/assets/style.css">
  <link rel="stylesheet" href="/pages/vip/admin/style.css">
</head>
<body>
  <main
    class="vip-admin-page"
    data-vip-admin-app
    data-admin-view="dashboard"
    data-clerk-publishable-key="<?php echo htmlspecialchars($publishableKey, ENT_QUOTES, 'UTF-8'); ?>"
  >
    <section class="admin-hero">
      <div>
        <p class="eyebrow">VIP ADMIN</p>
        <h1>报名管理后台</h1>
        <p class="hero-copy">通过 Clerk 登录后，你可以查看报名资料、编辑信息，并切换审核状态。</p>
      </div>
      <div class="hero-actions">
        <div class="hero-chip" data-admin-user-chip hidden></div>
        <button type="button" class="ghost-button" data-admin-signout hidden>退出登录</button>
      </div>
    </section>

    <section class="admin-shell" data-admin-shell>
      <div class="admin-state-card is-hidden" data-forbidden-state>
        <div class="state-copy">
          <p class="state-kicker">Access Restricted</p>
          <h2>当前账号没有后台权限</h2>
          <p data-forbidden-message>请联系管理员将你的 Clerk 账号加入白名单。</p>
        </div>
        <div class="state-actions">
          <button type="button" class="ghost-button" data-admin-signout>退出并切换账号</button>
          <button type="button" class="primary-button" data-admin-retry>重新检查权限</button>
        </div>
      </div>

      <div class="dashboard is-hidden" data-dashboard>
        <aside class="signup-sidebar">
          <div class="sidebar-top">
            <div>
              <p class="state-kicker">Signups</p>
              <h2>报名列表</h2>
            </div>
            <button type="button" class="ghost-button" data-admin-refresh>刷新</button>
          </div>

          <div class="toolbar">
            <label class="field">
              <span>搜索</span>
              <input type="search" placeholder="昵称、地点、原因、自我介绍" data-admin-search>
            </label>
            <label class="field">
              <span>状态</span>
              <select data-admin-status>
                <option value="all">全部</option>
                <option value="pending">待审核</option>
                <option value="approved">已审核</option>
              </select>
            </label>
          </div>

          <div class="sidebar-stats" data-admin-counts>
            <span>全部 0</span>
            <span>待审核 0</span>
            <span>已审核 0</span>
          </div>

          <div class="signup-list" data-signup-list></div>
          <p class="list-feedback" data-list-feedback></p>
        </aside>

        <section class="editor-panel">
          <form class="editor-card" data-admin-form>
            <div class="editor-top">
              <div>
                <p class="state-kicker">Editor</p>
                <h2 data-editor-title>请选择一条报名资料</h2>
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
  <script src="/pages/vip/admin/script.js" defer></script>
</body>
</html>
