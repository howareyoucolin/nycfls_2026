const form = document.querySelector('[data-multistep-form]');

if (form) {
  const isDebugMode = new URLSearchParams(window.location.search).has('debug');
  const panels = Array.from(form.querySelectorAll('[data-step-panel]'));
  const indicators = Array.from(document.querySelectorAll('[data-step-indicator]'));
  const pageIntro = document.querySelector('[data-page-intro]');
  const stepperShell = document.querySelector('.stepper-shell');
  const prevButton = form.querySelector('[data-step-action="prev"]');
  const nextButton = form.querySelector('[data-step-action="next"]');
  const submitButton = form.querySelector('[data-step-action="submit"]');
  const submitFeedback = form.querySelector('[data-submit-feedback]');
  const loadingScreen = document.querySelector('[data-loading-screen]');
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
  const contactTextLabel = form.querySelector('[data-contact-text-label]');
  const contactField = form.querySelector('#contact_info');
  const contactQrcodeWrap = form.querySelector('[data-contact-qrcode-field]');
  const contactQrcodeTitle = form.querySelector('[data-contact-qrcode-title]');
  const contactQrcodeField = form.querySelector('#contact_qrcode');
  const qrcodeDropzone = form.querySelector('[data-qrcode-dropzone]');
  const qrcodePreview = form.querySelector('[data-qrcode-preview]');
  const qrcodePreviewImage = form.querySelector('[data-qrcode-preview-image]');
  const qrcodeClearButton = form.querySelector('[data-qrcode-clear]');
  const confettiColors = ['#d94f33', '#ffd84d', '#4c8df6', '#f6b14f', '#d970d8', '#f5bccd', '#d27b2d', '#5d6ad8', '#a9d7ee'];
  let currentStep = 1;

  const contactCopyMap = {
    wechat: {
      label: '请输入你的微信',
      placeholder: '请输入你的微信号',
    },
    phone: {
      label: '请输入你的电话',
      placeholder: '请输入你的电话号码',
    },
    email: {
      label: '请输入你的邮箱',
      placeholder: '请输入你的邮箱地址',
    },
    qrcode: {
      title: '上传你的二维码',
    },
  };
  let qrcodePreviewUrl = '';
  let isSubmitting = false;

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
      if (currentLength <= 2000) {
        introField.setCustomValidity('');
      }
    }

    if (currentLength > 2000) {
      introError.hidden = false;
      introField.setCustomValidity('自我介绍最多可填写 2000 个字。');
      return false;
    }

    if (currentLength >= 40) {
      introError.hidden = true;
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
    const contactType = contactTypeField.value;

    contactFieldWrap.hidden = !isVisible;
    contactTypeField.disabled = !isVisible;
    contactTypeField.required = isVisible;

    const isTextContact = isVisible && contactType !== '' && contactType !== 'qrcode';
    const isQrcodeContact = isVisible && contactType === 'qrcode';

    contactTextWrap.hidden = !isTextContact;
    contactField.disabled = !isTextContact;
    contactField.required = isTextContact;

    contactQrcodeWrap.hidden = !isQrcodeContact;
    contactQrcodeField.disabled = !isQrcodeContact;
    contactQrcodeField.required = isQrcodeContact;

    if (isTextContact) {
      const textCopy = contactCopyMap[contactType];
      contactTextLabel.textContent = textCopy.label;
      contactField.placeholder = textCopy.placeholder;
    }

    if (isQrcodeContact) {
      contactQrcodeTitle.textContent = contactCopyMap.qrcode.title;
    }

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
      contactTextLabel.textContent = '请输入你的联系方式';
      contactField.placeholder = '请输入你的联系方式';
      contactQrcodeTitle.textContent = '上传二维码';
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
    qrcodeDropzone.hidden = false;
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
    qrcodeDropzone.hidden = true;
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

  const setSubmitFeedback = (message = '') => {
    submitFeedback.textContent = message;
    submitFeedback.hidden = message === '';
  };

  const setSubmittingState = (submitting) => {
    isSubmitting = submitting;
    prevButton.disabled = submitting;
    nextButton.disabled = submitting;
    submitButton.disabled = submitting;
  };

  prevButton.addEventListener('click', () => {
    if (isSubmitting) {
      return;
    }

    currentStep = Math.max(1, currentStep - 1);
    updateStepUI();
  });

  nextButton.addEventListener('click', () => {
    if (isSubmitting) {
      return;
    }

    if (!validateStep(currentStep)) {
      return;
    }

    setSubmitFeedback('');
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
    if (isSubmitting) {
      event.preventDefault();
      return;
    }

    if (!validateStep(currentStep)) {
      event.preventDefault();
      return;
    }

    event.preventDefault();

    if (isDebugMode) {
      setSubmitFeedback('');
      setSubmittingState(true);
      loadingScreen.hidden = false;

      window.setTimeout(() => {
        loadingScreen.hidden = true;
        form.hidden = true;
        pageIntro.hidden = true;
        stepperShell.hidden = true;
        successScreen.hidden = false;
        launchConfetti();
        setSubmittingState(false);
      }, 5000);

      return;
    }

    const submitUrl = form.action;
    const formData = new FormData(form);
    setSubmitFeedback('');
    setSubmittingState(true);
    loadingScreen.hidden = false;

    fetch(submitUrl, {
      method: 'POST',
      body: formData,
    })
      .then(async (response) => {
        const result = await response.json().catch(() => ({
          ok: false,
          message: '提交失败，请稍后再试。',
        }));

        if (!response.ok || !result.ok) {
          throw new Error(result.message || '提交失败，请稍后再试。');
        }

        form.hidden = true;
        pageIntro.hidden = true;
        stepperShell.hidden = true;
        loadingScreen.hidden = true;
        successScreen.hidden = false;
        launchConfetti();
      })
      .catch((error) => {
        loadingScreen.hidden = true;
        setSubmitFeedback(error.message || '提交失败，请稍后再试。');
      })
      .finally(() => {
        setSubmittingState(false);
      });
  });

  updateIntroState();
  updateLocationFieldState();
  updateReasonFieldState();
  updateContactFieldState();
  updateStepUI();
}
