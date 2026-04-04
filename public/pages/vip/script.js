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

const copyModal = document.querySelector('[data-copy-modal]');
const copyModalTitle = document.querySelector('[data-copy-modal-title]');
const copyModalText = document.querySelector('[data-copy-modal-text]');
const copyModalCloseButtons = document.querySelectorAll('[data-copy-modal-close]');

function setCopyModalOpen(isOpen, title = '', text = '') {
  if (!copyModal) {
    return;
  }

  copyModal.classList.toggle('is-hidden', !isOpen);
  copyModal.setAttribute('aria-hidden', isOpen ? 'false' : 'true');

  if (isOpen) {
    if (copyModalTitle) {
      copyModalTitle.textContent = title;
    }
    if (copyModalText) {
      copyModalText.textContent = text;
    }
    document.body.classList.add('vip-modal-open');
    return;
  }

  document.body.classList.remove('vip-modal-open');
}

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
    setCopyModalOpen(
      true,
      copied ? '资料已复制' : '复制失败',
      copied ? '会员资料文案已复制。' : '会员资料文案复制失败，请再试一次。'
    );
  });
});

document.querySelectorAll('[data-copy-link]').forEach((button) => {
  button.addEventListener('click', async () => {
    const value = button.getAttribute('data-copy-link-value') || '';
    const copied = await copyTextValue(value);
    setCopyModalOpen(
      true,
      copied ? '链接已复制' : '复制失败',
      copied ? '成员详情链接已复制。' : '成员详情链接复制失败，请再试一次。'
    );
  });
});

copyModalCloseButtons.forEach((button) => {
  button.addEventListener('click', () => {
    setCopyModalOpen(false);
  });
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    setCopyModalOpen(false);
  }
});
