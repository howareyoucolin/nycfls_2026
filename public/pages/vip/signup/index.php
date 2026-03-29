<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>匿名资料填写</title>
  <link rel="stylesheet" href="/assets/style.css">
  <link rel="stylesheet" href="/pages/vip/signup/style.css">
</head>
<body>
  <main class="page">
    <h1>匿名资料填写</h1>
    <p class="intro">整个填写流程不到 1 分钟，请按步骤完成填写，每一步完成后即可进入下一步。</p>

    <div class="stepper-shell">
      <ol class="stepper" aria-label="填写步骤">
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

    <form method="post" novalidate data-multistep-form>
      <section class="section step-panel is-active" data-step-panel="1">
        <p class="section-title">步骤 1 / 基本信息</p>
        <div class="fields">
          <label for="nickname">
            匿名 / 昵称
            <input id="nickname" name="nickname" type="text" placeholder="请输入匿名名称或昵称" required>
          </label>

          <label for="generation">
            出生年代
            <select id="generation" name="generation" required>
              <option value="" selected>请选择</option>
              <option value="70后">70后</option>
              <option value="80后">80后</option>
              <option value="90后">90后</option>
              <option value="00后">00后</option>
            </select>
          </label>

          <fieldset class="choice-group">
            <legend>性别</legend>
            <div class="segmented-control" role="radiogroup" aria-label="性别">
              <label class="segment-option">
                <input type="radio" name="gender" value="男生" required>
                <span>男生</span>
              </label>
              <label class="segment-option">
                <input type="radio" name="gender" value="女生" required>
                <span>女生</span>
              </label>
            </div>
          </fieldset>

          <label for="location">
            所在地
            <select id="location" name="location" required>
              <option value="" selected>请选择</option>
              <option value="皇后区法拉盛">皇后区法拉盛</option>
              <option value="皇后区贝赛">皇后区Bayside</option>
              <option value="皇后区艾姆赫斯特">皇后区Elmhurst</option>
              <option value="皇后区长岛市">皇后区LIC</option>
              <option value="布鲁克林">布鲁克林</option>
              <option value="曼哈顿">曼哈顿</option>
              <option value="皇后区">皇后区</option>
              <option value="纽约上州">纽约上州</option>
              <option value="长岛">长岛</option>
              <option value="新泽西">新泽西</option>
              <option value="other">其他</option>
            </select>
          </label>

          <div class="conditional-field" data-location-other-field hidden>
            <label for="location_other">
              请补充所在地
              <input id="location_other" name="location_other" type="text" placeholder="请输入你的所在地" disabled>
            </label>
          </div>
        </div>
      </section>

      <section class="section step-panel" data-step-panel="2" hidden>
        <p class="section-title">步骤 2 / 自我介绍</p>
        <div class="fields">
          <label for="join_reason">
            想加入群组的原因
            <select id="join_reason" name="join_reason" required>
              <option value="" selected>请选择</option>
              <option value="结婚">结婚</option>
              <option value="恋爱">恋爱</option>
              <option value="交朋友">交朋友</option>
              <option value="搭子">搭子</option>
              <option value="other">其他</option>
            </select>
          </label>

          <div class="conditional-field" data-reason-other-field hidden>
            <label for="join_reason_other">
              请补充说明
              <input id="join_reason_other" name="join_reason_other" type="text" placeholder="请填写你的加入原因" disabled>
            </label>
          </div>

          <label for="intro_text">
            请简单介绍一下你自己
            <textarea id="intro_text" name="intro_text" placeholder="请用几句话介绍你的个性、兴趣或想让别人认识你的地方" required minlength="40" aria-describedby="intro_hint intro_error"></textarea>
          </label>
          <p class="hint" id="intro_hint">最少填写 40 个字。</p>
          <p class="error-text" id="intro_error" data-intro-error hidden>自我介绍至少需要填写 40 个字。</p>
          <p class="counter-text" data-intro-count>当前 0 / 40</p>
        </div>
      </section>

      <section class="section step-panel" data-step-panel="3" hidden>
        <p class="section-title">步骤 3 / 联系方式</p>
        <div class="fields">
          <fieldset class="choice-group">
            <legend>是否愿意公开你的联系方式？</legend>
            <div class="segmented-control" role="radiogroup" aria-label="是否愿意公开你的联系方式">
              <label class="segment-option">
                <input type="radio" name="contact_visibility" value="yes" required>
                <span>愿意</span>
              </label>
              <label class="segment-option">
                <input type="radio" name="contact_visibility" value="no" required>
                <span>不愿意</span>
              </label>
            </div>
          </fieldset>

          <div class="contact-field" data-contact-field hidden>
            <label for="contact_type">
              联系方式类型
              <select id="contact_type" name="contact_type" disabled>
                <option value="" selected>请选择</option>
                <option value="wechat">微信</option>
                <option value="phone">电话</option>
                <option value="email">邮箱</option>
                <option value="qrcode">二维码</option>
              </select>
            </label>

            <div class="conditional-field" data-contact-text-field hidden>
              <label for="contact_info">
                联系方式内容
                <input id="contact_info" name="contact_info" type="text" placeholder="请输入具体联系方式" disabled>
              </label>
            </div>

            <div class="conditional-field" data-contact-qrcode-field hidden>
              <div class="upload-card">
                <div class="upload-copy">
                  <p class="upload-title">上传二维码</p>
                  <p class="hint">支持 JPG、PNG 等常见图片格式，上传后会立即显示预览。</p>
                </div>
                <label for="contact_qrcode" class="upload-dropzone">
                  <input id="contact_qrcode" name="contact_qrcode" type="file" accept="image/*" disabled>
                  <span class="upload-icon">+</span>
                  <span class="upload-label">选择二维码图片</span>
                  <span class="upload-subtext">点击上传你的二维码</span>
                </label>
                <div class="qrcode-preview" data-qrcode-preview hidden>
                  <img src="" alt="二维码预览" class="qrcode-preview-image" data-qrcode-preview-image>
                  <button type="button" class="preview-clear" data-qrcode-clear>重新选择</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div class="actions">
        <button type="button" class="ghost-button" data-step-action="prev" hidden>上一步</button>
        <button type="button" class="primary-button" data-step-action="next">下一步</button>
        <button type="submit" class="primary-button" data-step-action="submit" hidden>提交</button>
      </div>
    </form>

    <section class="success-screen" data-success-screen hidden>
      <div class="success-confetti" data-confetti aria-hidden="true"></div>
      <div class="success-card">
        <div class="success-check">✓</div>
        <p class="success-kicker">提交完成</p>
        <h2>提交成功！</h2>
        <p class="success-copy">感谢你的填写，你的资料已经成功提交。</p>
      </div>
    </section>
  </main>
  <script src="/pages/vip/signup/script.js" defer></script>
</body>
</html>
