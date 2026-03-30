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
