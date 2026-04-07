const form = document.querySelector('[data-multistep-form]');

if (form) {
  const isDebugMode = new URLSearchParams(window.location.search).has('debug');
  const page = document.querySelector('.page');
  const pageMode = page?.dataset.pageMode === 'edit' ? 'edit' : 'signup';
  const signupNavLink = document.querySelector('[data-vip-signup-link]');
  const panels = Array.from(form.querySelectorAll('[data-step-panel]'));
  const indicators = Array.from(document.querySelectorAll('[data-step-indicator]'));
  const vipNav = document.querySelector('[data-vip-nav]');
  const pageIntro = document.querySelector('[data-page-intro]');
  const pageTitle = document.querySelector('[data-signup-title]');
  const pageIntroCopy = document.querySelector('[data-signup-intro]');
  const modeBanner = document.querySelector('[data-signup-mode-banner]');
  const editModeHero = document.querySelector('[data-edit-mode-hero]');
  const stepperShell = document.querySelector('[data-stepper-shell]');
  const prevButton = form.querySelector('[data-step-action="prev"]');
  const nextButton = form.querySelector('[data-step-action="next"]');
  const submitButton = form.querySelector('[data-step-action="submit"]');
  const submitFeedback = form.querySelector('[data-submit-feedback]');
  const loadingScreen = document.querySelector('[data-loading-screen]');
  const loadingTitle = document.querySelector('[data-loading-title]');
  const loadingCopy = document.querySelector('[data-loading-copy]');
  const successScreen = document.querySelector('[data-success-screen]');
  const successTitle = document.querySelector('[data-success-title]');
  const successCopy = document.querySelector('[data-success-copy]');
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
  const fingerprintField = form.querySelector('[data-device-fingerprint]');
  const existingVipIdField = form.querySelector('[data-existing-vip-id]');
  const existingQrcodePathField = form.querySelector('[data-existing-qrcode-path]');
  const confettiColors = ['#d94f33', '#ffd84d', '#4c8df6', '#f6b14f', '#d970d8', '#f5bccd', '#d27b2d', '#5d6ad8', '#a9d7ee'];
  const fingerprintStorageKey = 'vip-signup-device-fingerprint-v1';
  const existingProfileStorageKey = 'vip-signup-existing-profile-v1';
  const generationValueMap = {
    70: '70后',
    80: '80后',
    90: '90后',
    00: '00后',
  };
  const genderValueMap = {
    m: '男生',
    f: '女生',
  };
  const knownLocations = new Set([
    '皇后区法拉盛',
    '皇后区Bayside',
    '皇后区Elmhurst',
    '皇后区LIC',
    '布鲁克林',
    '曼哈顿',
    '皇后区',
    '纽约上州',
    '长岛',
    '新泽西',
  ]);
  const knownJoinReasons = new Set(['结婚', '恋爱', '交朋友', '搭子']);
  let currentStep = 1;
  let profileMode = 'create';

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

  const readExistingProfileFlag = () => {
    try {
      return window.sessionStorage.getItem(existingProfileStorageKey) === '1';
    } catch (error) {
      return false;
    }
  };

  const writeExistingProfileFlag = (value) => {
    try {
      if (value) {
        window.sessionStorage.setItem(existingProfileStorageKey, '1');
      } else {
        window.sessionStorage.removeItem(existingProfileStorageKey);
      }
    } catch (error) {
      // Ignore storage failures.
    }
  };

  const syncSignupNavLabel = (hasExistingProfile) => {
    if (!signupNavLink) {
      return;
    }

    const shouldShowEdit = pageMode === 'edit' || hasExistingProfile;
    signupNavLink.textContent = shouldShowEdit ? '编辑我的资料' : '报名成为群成员';
    signupNavLink.setAttribute('href', shouldShowEdit ? '/vip/edit' : '/vip/signup');
  };

  const redirectToModePage = (targetMode) => {
    const currentParams = new URLSearchParams(window.location.search);
    const targetPath = targetMode === 'edit' ? '/vip/edit' : '/vip/signup';
    const query = currentParams.toString();
    const nextUrl = query ? `${targetPath}?${query}` : targetPath;

    if (`${window.location.pathname}${window.location.search}` === nextUrl) {
      return;
    }

    window.location.href = nextUrl;
  };

  const setLoadingContent = (title, copy) => {
    if (loadingTitle) {
      loadingTitle.textContent = title;
    }
    if (loadingCopy) {
      loadingCopy.textContent = copy;
    }
  };

  const setSuccessContent = (title, copy) => {
    if (successTitle) {
      successTitle.textContent = title;
    }
    if (successCopy) {
      successCopy.textContent = copy;
    }
  };

  const syncModeUI = () => {
    const isEditMode = profileMode === 'edit';
    page?.classList.toggle('is-edit-mode', isEditMode);

    if (pageTitle) {
      pageTitle.textContent = isEditMode ? '编辑群成员资料' : '群成员资料填写';
    }
    if (pageIntroCopy) {
      pageIntroCopy.textContent = isEditMode
        ? '我们已经帮你带出最近一次填写的资料，你可以直接修改并重新提交。'
        : '整个填写流程不到 1 分钟，请按步骤完成填写，每一步完成后即可进入下一步。';
    }
    if (modeBanner) {
      modeBanner.hidden = !isEditMode;
    }
    if (editModeHero) {
      editModeHero.hidden = !isEditMode;
    }
    if (submitButton) {
      submitButton.textContent = isEditMode ? '提交更新' : '提交';
    }

    setSuccessContent(
      isEditMode ? '更新已提交！' : '提交成功！',
      isEditMode
        ? '你的资料更新已经提交，我们会先保留当前展示内容，待管理员审核通过后再应用这次修改。'
        : '感谢你的填写，你的资料已经成功提交。我们会尽快审核你的申请，并在完成后尽快与你联系。'
    );
    syncSignupNavLabel(isEditMode || readExistingProfileFlag());
  };

  const buildFingerprintSource = () => {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    const nav = window.navigator || {};
    const screenInfo = window.screen || {};

    return [
      nav.userAgent || '',
      nav.language || '',
      Array.isArray(nav.languages) ? nav.languages.join(',') : '',
      nav.platform || '',
      String(nav.hardwareConcurrency || ''),
      String(nav.deviceMemory || ''),
      timezone,
      String(screenInfo.width || ''),
      String(screenInfo.height || ''),
      String(screenInfo.colorDepth || ''),
      String(window.devicePixelRatio || ''),
      String('ontouchstart' in window),
      String(new Date().getTimezoneOffset()),
    ].join('|');
  };

  const hashFingerprint = async (value) => {
    if (!value) {
      return '';
    }

    if (window.crypto && window.crypto.subtle && typeof window.TextEncoder === 'function') {
      const bytes = new window.TextEncoder().encode(value);
      const digest = await window.crypto.subtle.digest('SHA-256', bytes);
      return Array.from(new Uint8Array(digest))
        .map((byte) => byte.toString(16).padStart(2, '0'))
        .join('');
    }

    let hash = 0;
    for (let index = 0; index < value.length; index += 1) {
      hash = ((hash << 5) - hash) + value.charCodeAt(index);
      hash |= 0;
    }

    return `fallback-${Math.abs(hash)}`;
  };

  const readStoredFingerprint = () => {
    try {
      const value = window.localStorage.getItem(fingerprintStorageKey) || '';
      return String(value).trim();
    } catch (error) {
      return '';
    }
  };

  const writeStoredFingerprint = (value) => {
    if (!value) {
      return;
    }

    try {
      window.localStorage.setItem(fingerprintStorageKey, value);
    } catch (error) {
      // Ignore storage failures.
    }
  };

  const generatePersistentFingerprint = async () => {
    const existing = readStoredFingerprint();
    if (existing) {
      return existing;
    }

    const source = buildFingerprintSource();
    if (!source) {
      return '';
    }

    const fingerprint = await hashFingerprint(source);
    writeStoredFingerprint(fingerprint);
    return fingerprint;
  };

  const populateFingerprint = async () => {
    if (!fingerprintField) {
      return '';
    }

    try {
      fingerprintField.value = await generatePersistentFingerprint();
      return fingerprintField.value;
    } catch (error) {
      fingerprintField.value = '';
      return '';
    }
  };

  const showExistingQrcodePreview = (path) => {
    clearQrcodePreview();

    if (!path) {
      return;
    }

    qrcodePreviewImage.src = `/${String(path).replace(/^\/+/, '')}`;
    qrcodePreview.hidden = false;
    qrcodeDropzone.hidden = true;
  };

  const applySelectValue = (field, knownValues, value, otherField, updateState) => {
    const normalizedValue = String(value || '').trim();

    if (normalizedValue !== '' && knownValues.has(normalizedValue)) {
      field.value = normalizedValue;
      otherField.value = '';
    } else if (normalizedValue !== '') {
      field.value = 'other';
      otherField.value = normalizedValue;
    } else {
      field.value = '';
      otherField.value = '';
    }

    updateState();
  };

  const applyExistingProfile = (profile) => {
    const item = profile && typeof profile === 'object' ? profile : null;
    const contactType = item && item.contact_type ? String(item.contact_type) : '';
    const hasContact = contactType !== '';
    const sourceVipId = item ? Number(item.source_vip_id || item.id || 0) : 0;

    profileMode = item ? 'edit' : 'create';
    existingVipIdField.value = sourceVipId > 0 ? String(sourceVipId) : '';

    form.elements.nickname.value = item ? String(item.nickname || '') : '';
    form.elements.generation.value = item ? (generationValueMap[String(item.generation || '')] || '') : '';

    const targetGender = item ? (genderValueMap[String(item.gender || '')] || '') : '';
    form.querySelectorAll('input[name="gender"]').forEach((field) => {
      field.checked = field.value === targetGender;
    });

    applySelectValue(
      locationField,
      knownLocations,
      item ? String(item.location || '') : '',
      locationOtherField,
      updateLocationFieldState
    );

    applySelectValue(
      joinReasonField,
      knownJoinReasons,
      item ? String(item.join_reason || '') : '',
      joinReasonOtherField,
      updateReasonFieldState
    );

    introField.value = item ? String(item.intro_text || '') : '';

    contactVisibilityFields.forEach((field) => {
      field.checked = hasContact ? field.value === 'yes' : field.value === 'no';
    });

    contactTypeField.value = hasContact ? contactType : '';
    contactField.value = item && contactType !== 'qrcode' ? String(item.contact_info || '') : '';
    existingQrcodePathField.value = item && contactType === 'qrcode' ? String(item.contact_qrcode_path || '') : '';
    contactQrcodeField.value = '';

    updateContactFieldState();

    if (existingQrcodePathField.value !== '' && contactType === 'qrcode') {
      showExistingQrcodePreview(existingQrcodePathField.value);
    } else {
      clearQrcodePreview();
    }

    updateIntroState();
    syncModeUI();
  };

  const loadExistingProfile = async (fingerprint) => {
    if (!fingerprint || isDebugMode) {
      writeExistingProfileFlag(false);
      syncSignupNavLabel(false);
      if (pageMode === 'edit') {
        redirectToModePage('signup');
        return;
      }
      applyExistingProfile(null);
      return;
    }

    const response = await fetch(`/api/vip-signup-profile.php?fingerprint=${encodeURIComponent(fingerprint)}`, {
      method: 'GET',
      cache: 'no-store',
    });
    const result = await response.json().catch(() => ({
      ok: false,
      message: '资料加载失败，请稍后再试。',
    }));

    if (!response.ok || !result.ok) {
      throw new Error(result.message || '资料加载失败，请稍后再试。');
    }

    const item = result.data?.item || null;
    const hasExistingProfile = Boolean(item);

    writeExistingProfileFlag(hasExistingProfile);
    syncSignupNavLabel(hasExistingProfile);

    if (item && pageMode !== 'edit') {
      redirectToModePage('edit');
      return;
    }

    if (!item && pageMode === 'edit') {
      redirectToModePage('signup');
      return;
    }

    applyExistingProfile(item);
  };

  const getVisibleLength = (value) => value.trim().length;

  const updateStepUI = () => {
    const isEditMode = profileMode === 'edit';

    panels.forEach((panel, index) => {
      const step = index + 1;
      const isActive = isEditMode || step === currentStep;
      panel.hidden = !isActive;
      panel.classList.toggle('is-active', isActive);
    });

    if (stepperShell) {
      stepperShell.hidden = isEditMode;
    }

    indicators.forEach((indicator, index) => {
      const step = index + 1;
      indicator.classList.toggle('is-active', !isEditMode && step === currentStep);
      indicator.classList.toggle('is-complete', !isEditMode && step < currentStep);
    });

    prevButton.hidden = isEditMode || currentStep === 1;
    nextButton.hidden = isEditMode || currentStep === panels.length;
    submitButton.hidden = isEditMode ? false : currentStep !== panels.length;
  };

  const validateForSubmit = () => {
    if (profileMode === 'edit') {
      return [1, 2, 3].every((step) => validateStep(step));
    }

    return validateStep(currentStep);
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
      if (existingQrcodePathField) {
        existingQrcodePathField.value = '';
      }
      clearQrcodePreview();
    }

    if (!isVisible) {
      contactTypeField.value = '';
      contactField.value = '';
      contactQrcodeField.value = '';
      if (existingQrcodePathField) {
        existingQrcodePathField.value = '';
      }
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

  const showSuccessScreen = () => {
    form.hidden = true;
    if (vipNav) {
      vipNav.hidden = true;
    }
    pageIntro.hidden = true;
    stepperShell.hidden = true;
    page?.classList.add('is-success');
    successScreen.hidden = false;
    launchConfetti();
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
    existingQrcodePathField.value = '';
    contactQrcodeField.value = '';
    clearQrcodePreview();
  });

  form.addEventListener('submit', async (event) => {
    if (isSubmitting) {
      event.preventDefault();
      return;
    }

    if (!validateForSubmit()) {
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
        showSuccessScreen();
        setSubmittingState(false);
      }, 5000);

      return;
    }

    const submitUrl = form.action;
    setLoadingContent('正在提交资料', profileMode === 'edit' ? '请稍等一下，我们正在保存你的更新并提交审核。' : '请稍等一下，我们正在保存你的信息。');
    await populateFingerprint();
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

        loadingScreen.hidden = true;
        showSuccessScreen();
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
  syncSignupNavLabel(readExistingProfileFlag());
  updateStepUI();
  syncModeUI();
  setLoadingContent('正在识别资料', '请稍等一下，我们正在检查你是否已经填写过资料。');
  loadingScreen.hidden = false;

  populateFingerprint()
    .then((fingerprint) => loadExistingProfile(fingerprint))
    .catch((error) => {
      setSubmitFeedback(error.message || '资料加载失败，请刷新页面重试。');
      applyExistingProfile(null);
    })
    .finally(() => {
      loadingScreen.hidden = true;
      form.hidden = false;
      updateStepUI();
    });
}
