document.querySelectorAll('[data-intro-toggle]').forEach((button) => {
  button.addEventListener('click', () => {
    const introBlock = button.closest('.intro-block');
    const introText = introBlock?.querySelector('[data-intro-text]');

    if (!introText) {
      return;
    }

    const isExpanded = button.dataset.expanded === 'true';

    if (isExpanded) {
      introText.innerHTML = introText.dataset.collapsedText ?? '';
      button.textContent = '查看全部';
      button.dataset.expanded = 'false';
      return;
    }

    introText.innerHTML = (introText.dataset.fullText ?? '').replace(/\n/g, '<br>');
    button.textContent = '收起';
    button.dataset.expanded = 'true';
  });
});

async function copyTextValue(value) {
  if (!value) {
    return false;
  }

  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch (error) {
    const textarea = document.createElement('textarea');
    textarea.value = value;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand('copy');
    textarea.remove();
    return copied;
  }
}

document.querySelectorAll('[data-copy-card]').forEach((button) => {
  button.addEventListener('click', async () => {
    const value = button.getAttribute('data-copy-text') || '';
    const copied = await copyTextValue(value);
    const originalTitle = button.getAttribute('title') || '复制会员文案';
    button.setAttribute('title', copied ? '已复制' : '复制失败');
    window.setTimeout(() => {
      button.setAttribute('title', originalTitle);
    }, 1200);
  });
});

document.querySelectorAll('[data-copy-link]').forEach((button) => {
  button.addEventListener('click', async () => {
    const value = button.getAttribute('data-copy-link-value') || '';
    const copied = await copyTextValue(value);
    const originalTitle = button.getAttribute('title') || '复制详情链接';
    button.setAttribute('title', copied ? '已复制' : '复制失败');
    window.setTimeout(() => {
      button.setAttribute('title', originalTitle);
    }, 1200);
  });
});
