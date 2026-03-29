const form = document.querySelector('[data-multistep-form]');

if (form) {
  const isDebugMode = new URLSearchParams(window.location.search).has('debug');
  const panels = Array.from(form.querySelectorAll('[data-step-panel]'));
  const indicators = Array.from(document.querySelectorAll('[data-step-indicator]'));
  const stepperShell = document.querySelector('.stepper-shell');
  const prevButton = form.querySelector('[data-step-action="prev"]');
  const nextButton = form.querySelector('[data-step-action="next"]');
  const submitButton = form.querySelector('[data-step-action="submit"]');
  const successScreen = document.querySelector('[data-success-screen]');
  const confettiRoot = document.querySelector('[data-confetti]');
  const introField = form.querySelector('#intro_text');
  const introError = form.querySelector('[data-intro-error]');
  const introCount = form.querySelector('[data-intro-count]');
  const locationField = form.querySelector('#location');
  const locationOtherWrap = form.querySelector('[data-location-other-field]');
  const locationOtherField = form.querySelector('#location_other');
  const joinReasonField = form.querySelector('#join_reason');
  const joinReasonOtherWrap = form.querySelector('[data-reason-other-field]');
  const joinReasonOtherField = form.querySelector('#join_reason_other');
  const contactVisibilityFields = Array.from(form.querySelectorAll('input[name="contact_visibility"]'));
  const contactFieldWrap = form.querySelector('[data-contact-field]');
  const contactTypeField = form.querySelector('#contact_type');
  const contactTextWrap = form.querySelector('[data-contact-text-field]');
  const contactField = form.querySelector('#contact_info');
  const contactQrcodeWrap = form.querySelector('[data-contact-qrcode-field]');
  const contactQrcodeField = form.querySelector('#contact_qrcode');
  const qrcodePreview = form.querySelector('[data-qrcode-preview]');
  const qrcodePreviewImage = form.querySelector('[data-qrcode-preview-image]');
  const qrcodeClearButton = form.querySelector('[data-qrcode-clear]');
  const confettiColors = ['#d94f33', '#ffd84d', '#4c8df6', '#f6b14f', '#d970d8', '#f5bccd', '#d27b2d', '#5d6ad8', '#a9d7ee'];
  let currentStep = 1;
  let qrcodePreviewUrl = '';

  const getVisibleLength = (value) => value.trim().length;

  const updateStepUI = () => {
    panels.forEach((panel, index) => {
      const step = index + 1;
      const isActive = step === currentStep;
      panel.hidden = !isActive;
      panel.classList.toggle('is-active', isActive);
    });

    indicators.forEach((indicator, index) => {
      const step = index + 1;
      indicator.classList.toggle('is-active', step === currentStep);
      indicator.classList.toggle('is-complete', step < currentStep);
    });

    prevButton.hidden = currentStep === 1;
    nextButton.hidden = currentStep === panels.length;
    submitButton.hidden = currentStep !== panels.length;
  };

  const updateIntroState = () => {
    const currentLength = getVisibleLength(introField.value);
    introCount.textContent = `当前 ${currentLength} / 40`;

    if (currentLength === 0 || currentLength >= 40) {
      introError.hidden = true;
      introField.setCustomValidity('');
      return true;
    }

    introError.hidden = false;
    introField.setCustomValidity('自我介绍至少需要填写 40 个字。');
    return false;
  };

  const updateLocationFieldState = () => {
    const isOther = locationField.value === 'other';
    locationOtherWrap.hidden = !isOther;
    locationOtherField.disabled = !isOther;
    locationOtherField.required = isOther;

    if (!isOther) {
      locationOtherField.value = '';
      locationOtherField.setCustomValidity('');
    }
  };

  const updateReasonFieldState = () => {
    const isOther = joinReasonField.value === 'other';
    joinReasonOtherWrap.hidden = !isOther;
    joinReasonOtherField.disabled = !isOther;
    joinReasonOtherField.required = isOther;

    if (!isOther) {
      joinReasonOtherField.value = '';
      joinReasonOtherField.setCustomValidity('');
    }
  };

  const updateContactFieldState = () => {
    const selectedValue = form.querySelector('input[name="contact_visibility"]:checked')?.value;
    const isVisible = selectedValue === 'yes';

    contactFieldWrap.hidden = !isVisible;
    contactTypeField.disabled = !isVisible;
    contactTypeField.required = isVisible;

    const isTextContact = isVisible && contactTypeField.value !== '' && contactTypeField.value !== 'qrcode';
    const isQrcodeContact = isVisible && contactTypeField.value === 'qrcode';

    contactTextWrap.hidden = !isTextContact;
    contactField.disabled = !isTextContact;
    contactField.required = isTextContact;

    contactQrcodeWrap.hidden = !isQrcodeContact;
    contactQrcodeField.disabled = !isQrcodeContact;
    contactQrcodeField.required = isQrcodeContact;

    if (!isQrcodeContact) {
      contactQrcodeField.value = '';
      clearQrcodePreview();
    }

    if (!isVisible) {
      contactTypeField.value = '';
      contactField.value = '';
      contactQrcodeField.value = '';
      contactField.setCustomValidity('');
      contactQrcodeField.setCustomValidity('');
      contactTextWrap.hidden = true;
      contactQrcodeWrap.hidden = true;
      clearQrcodePreview();
    }
  };

  const clearQrcodePreview = () => {
    if (qrcodePreviewUrl) {
      URL.revokeObjectURL(qrcodePreviewUrl);
      qrcodePreviewUrl = '';
    }

    qrcodePreviewImage.src = '';
    qrcodePreview.hidden = true;
  };

  const updateQrcodePreview = () => {
    const [file] = Array.from(contactQrcodeField.files || []);

    clearQrcodePreview();

    if (!file) {
      return;
    }

    qrcodePreviewUrl = URL.createObjectURL(file);
    qrcodePreviewImage.src = qrcodePreviewUrl;
    qrcodePreview.hidden = false;
  };

  const validateStep = (step) => {
    if (isDebugMode) {
      return true;
    }

    if (step === 1) {
      updateLocationFieldState();
    }

    if (step === 2) {
      updateReasonFieldState();
    }

    if (step === 2 && !updateIntroState()) {
      introField.reportValidity();
      return false;
    }

    if (step === 3) {
      updateContactFieldState();
    }

    const panel = panels[step - 1];
    const fields = Array.from(panel.querySelectorAll('input, textarea, select')).filter((field) => !field.disabled);

    for (const field of fields) {
      if (!field.checkValidity()) {
        field.reportValidity();
        return false;
      }
    }

    return true;
  };

  const launchConfetti = () => {
    confettiRoot.innerHTML = '';

    for (let index = 0; index < 22; index += 1) {
      const piece = document.createElement('span');
      const width = 8 + Math.round(Math.random() * 8);
      const height = 14 + Math.round(Math.random() * 20);
      const left = Math.round(Math.random() * 92);
      const delay = Math.round(Math.random() * 420);
      const duration = 1400 + Math.round(Math.random() * 900);
      const drift = -36 + Math.round(Math.random() * 72);
      const rotateStart = -80 + Math.round(Math.random() * 160);
      const rotateEnd = rotateStart + 160 + Math.round(Math.random() * 260);
      const color = confettiColors[index % confettiColors.length];

      piece.className = 'confetti-piece';
      piece.style.left = `${left}%`;
      piece.style.width = `${width}px`;
      piece.style.height = `${height}px`;
      piece.style.background = color;
      piece.style.animationDelay = `${delay}ms`;
      piece.style.animationDuration = `${duration}ms`;
      piece.style.setProperty('--confetti-drift', `${drift}px`);
      piece.style.setProperty('--confetti-rotate-start', `${rotateStart}deg`);
      piece.style.setProperty('--confetti-rotate-end', `${rotateEnd}deg`);

      confettiRoot.append(piece);
    }
  };

  prevButton.addEventListener('click', () => {
    currentStep = Math.max(1, currentStep - 1);
    updateStepUI();
  });

  nextButton.addEventListener('click', () => {
    if (!validateStep(currentStep)) {
      return;
    }

    currentStep = Math.min(panels.length, currentStep + 1);
    updateStepUI();
  });

  introField.addEventListener('input', updateIntroState);
  locationField.addEventListener('change', updateLocationFieldState);
  joinReasonField.addEventListener('change', updateReasonFieldState);

  contactVisibilityFields.forEach((field) => {
    field.addEventListener('change', updateContactFieldState);
  });

  contactTypeField.addEventListener('change', updateContactFieldState);
  contactQrcodeField.addEventListener('change', updateQrcodePreview);
  qrcodeClearButton.addEventListener('click', () => {
    contactQrcodeField.value = '';
    clearQrcodePreview();
  });

  form.addEventListener('submit', (event) => {
    if (!validateStep(currentStep)) {
      event.preventDefault();
      return;
    }

    event.preventDefault();
    form.hidden = true;
    stepperShell.hidden = true;
    successScreen.hidden = false;
    launchConfetti();
  });

  updateIntroState();
  updateLocationFieldState();
  updateReasonFieldState();
  updateContactFieldState();
  updateStepUI();
}
