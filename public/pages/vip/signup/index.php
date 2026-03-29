<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>VIP 报名</title>
  <link rel="stylesheet" href="/assets/style.css">
  <link rel="stylesheet" href="/pages/vip/signup/style.css">
</head>
<body>
  <main class="page">
    <h1>VIP 报名表</h1>
    <p class="intro">这是一个三步骤报名流程，目前先完成前端体验，后续再接数据库、上传与第三方登录。</p>

    <div class="stepper-shell">
      <ol class="stepper" aria-label="报名步骤">
        <li class="step-item is-active" data-step-indicator="1">
          <span class="step-number">1</span>
        </li>
        <li class="step-connector" aria-hidden="true"></li>
        <li class="step-item" data-step-indicator="2">
          <span class="step-number">2</span>
        </li>
        <li class="step-connector" aria-hidden="true"></li>
        <li class="step-item" data-step-indicator="3">
          <span class="step-number">3</span>
        </li>
      </ol>
    </div>

    <form method="post" enctype="multipart/form-data" novalidate data-multistep-form>
      <section class="section step-panel is-active" data-step-panel="1">
        <p class="section-title">步骤 1 / 基本资料</p>
        <div class="fields">
          <label for="name">
            姓名
            <input id="name" name="name" type="text" placeholder="请输入您的姓名" required>
          </label>

          <label for="birth_year">
            出生年份
            <select id="birth_year" name="birth_year" required>
              <option value="" selected>---</option>
              <?php
              $currentYear = (int) date('Y');
              $maxBirthYear = $currentYear - 18;
              $minBirthYear = $currentYear - 60;
              ?>
              <?php for ($year = $maxBirthYear; $year >= $minBirthYear; $year--): ?>
                <option value="<?php echo $year; ?>">
                  <?php echo $year; ?>
                </option>
              <?php endfor; ?>
            </select>
          </label>

          <label for="description">
            自我介绍
            <textarea id="description" name="description" placeholder="请简单介绍一下自己" required></textarea>
          </label>
        </div>
      </section>

      <section class="section step-panel" data-step-panel="2" hidden>
        <p class="section-title">步骤 2 / 上传照片</p>
        <div class="fields">
          <label for="photos">
            上传照片
            <input id="photos" name="photos[]" type="file" accept="image/*" multiple>
          </label>
          <p class="hint">每次可上传 1 张，最多 6 张。若暂时不上传，也可以直接跳过这一步。</p>

          <div class="preview-wrap">
            <div class="photo-toolbar">
              <span class="photo-count" data-photo-count>已上传 0 / 6</span>
              <button type="button" class="text-button" data-photo-action="skip">跳过这一步</button>
            </div>
            <div class="preview-empty" data-preview-empty>还没有选择照片</div>
            <div class="preview-grid" data-preview-grid aria-live="polite"></div>
            <p class="hint" data-photo-limit hidden>最多只能上传 6 张照片。</p>
          </div>
        </div>
      </section>

      <section class="section step-panel" data-step-panel="3" hidden>
        <p class="section-title">步骤 3 / Gmail 账号</p>
        <div class="fields">
          <label for="gmail">
            Gmail 地址
            <input id="gmail" name="gmail" type="email" inputmode="email" autocomplete="email" placeholder="name@gmail.com" required>
          </label>
          <p class="hint">这一步先收集 Gmail 地址，未来可接入 Google 第三方登录。</p>
        </div>
      </section>

      <div class="actions">
        <button type="button" class="ghost-button" data-step-action="prev" hidden>上一步</button>
        <button type="button" class="primary-button" data-step-action="next">下一步</button>
        <button type="submit" class="primary-button" data-step-action="submit" hidden>提交报名</button>
      </div>
    </form>

    <section class="success-screen" data-success-screen hidden>
      <div class="success-confetti" data-confetti aria-hidden="true">
      </div>
      <div class="success-card">
        <p class="success-kicker">报名完成</p>
        <h2>提交成功</h2>
        <p class="success-copy">资料已经暂时保存在前端流程中。后续接上后端后，这里可以显示审核状态或下一步引导。</p>
      </div>
    </section>
  </main>
  <script src="/pages/vip/signup/script.js" defer></script>
</body>
</html>
