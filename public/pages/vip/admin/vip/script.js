(function () {
  const app = document.querySelector('[data-vip-admin-vip]');

  if (!app) {
    return;
  }

  const state = {
    clerk: null,
    token: null,
    item: null,
    pendingRequests: 0,
  };

  const els = {
    drawer: app.querySelector('[data-admin-drawer]'),
    drawerToggle: app.querySelector('[data-admin-drawer-toggle]'),
    drawerClose: app.querySelector('[data-admin-drawer-close]'),
    drawerBackdrop: app.querySelector('[data-admin-drawer-backdrop]'),
    loadingOverlay: app.querySelector('[data-admin-loading-overlay]'),
    loadingReason: app.querySelector('[data-admin-loading-reason]'),
    forbiddenState: app.querySelector('[data-forbidden-state]'),
    dashboard: app.querySelector('[data-dashboard]'),
    forbiddenTitle: app.querySelector('[data-forbidden-title]'),
    forbiddenMessage: app.querySelector('[data-forbidden-message]'),
    retryButton: app.querySelector('[data-admin-retry]'),
    signoutButtons: Array.from(app.querySelectorAll('[data-admin-signout]')),
    form: app.querySelector('[data-admin-form]'),
    saveButton: app.querySelector('[data-admin-save]'),
    title: app.querySelector('[data-editor-title]'),
    feedback: app.querySelector('[data-form-feedback]'),
    approveToggle: app.querySelector('[data-admin-approve-toggle]'),
    qrcodePreviewCard: app.querySelector('[data-qrcode-preview-card]'),
    qrcodePreviewImage: app.querySelector('[data-qrcode-preview-image]'),
    contactInfoField: app.querySelector('[data-contact-info-field]'),
    qrcodePathField: app.querySelector('[data-qrcode-path-field]'),
    metaCreated: app.querySelector('[data-meta-created]'),
    metaUpdated: app.querySelector('[data-meta-updated]'),
    metaApprovedBy: app.querySelector('[data-meta-approved-by]'),
    metaApprovedAt: app.querySelector('[data-meta-approved-at]'),
    metaIpLocation: app.querySelector('[data-meta-ip-location]'),
    metaDevice: app.querySelector('[data-meta-device]'),
  };

  const vipId = Number(app.dataset.adminVipId || 0);
  const publishableKey = app.dataset.clerkPublishableKey || '';
  const loginRoute = '/vip/admin/login';
  const loginRouteWithAuthFailure = `${loginRoute}?reason=auth_failed`;
  const mobileDrawerQuery = window.matchMedia('(max-width: 899px)');
  const auth = window.VipAdminAuth;

  function setDrawerOpen(isOpen) {
    const shouldOpen = Boolean(isOpen) && mobileDrawerQuery.matches;
    app.classList.toggle('is-drawer-open', shouldOpen);
    document.body.classList.toggle('admin-drawer-open', shouldOpen);

    if (els.drawerToggle) {
      els.drawerToggle.setAttribute('aria-expanded', shouldOpen ? 'true' : 'false');
    }
  }

  function closeDrawer() {
    setDrawerOpen(false);
  }

  function toggleDrawer() {
    setDrawerOpen(!app.classList.contains('is-drawer-open'));
  }

  function setView(view) {
    if (els.forbiddenState) {
      els.forbiddenState.classList.toggle('is-hidden', view !== 'forbidden');
    }
    if (els.dashboard) {
      els.dashboard.classList.toggle('is-hidden', view !== 'dashboard');
    }
  }

  function setLoading(isLoading, reason) {
    if (!els.loadingOverlay) {
      return;
    }

    els.loadingOverlay.classList.toggle('is-hidden', !isLoading);
    els.loadingOverlay.setAttribute('aria-hidden', isLoading ? 'false' : 'true');
    if (els.loadingReason) {
      els.loadingReason.textContent = reason || '正在处理中...';
    }
    document.body.classList.toggle('admin-loading', isLoading);
  }

  function startLoading(reason) {
    state.pendingRequests += 1;
    setLoading(true, reason);
  }

  function stopLoading() {
    state.pendingRequests = Math.max(0, state.pendingRequests - 1);
    if (state.pendingRequests === 0) {
      setLoading(false, '');
    }
  }

  function setFormFeedback(message, isError) {
    els.feedback.textContent = message || '';
    els.feedback.style.color = isError ? '#c64d34' : '#6c5b4d';
  }

  function buildForbiddenMessage(error) {
    const baseMessage = error && error.message ? error.message : '当前账号没有后台权限。';
    const payload = error && error.payload && error.payload.data ? error.payload.data : null;

    if (!payload) {
      return baseMessage;
    }

    const details = [];
    const emails = Array.isArray(payload.emails) ? payload.emails.filter(Boolean) : [];

    if (emails.length) {
      details.push(`Backend emails: ${emails.join(', ')}`);
    }

    if (payload.user_id) {
      details.push(`Clerk user_id: ${payload.user_id}`);
    }

    return details.length ? `${baseMessage}\n${details.join('\n')}` : baseMessage;
  }

  function formatDateTime(value) {
    if (!value) {
      return '--';
    }

    const normalized = String(value).replace(' ', 'T');
    const date = new Date(normalized);

    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function setEditorEnabled(enabled) {
    const controls = els.form.querySelectorAll('input, select, textarea, button');
    controls.forEach((control) => {
      if (control === els.saveButton) {
        control.disabled = !enabled;
        return;
      }

      control.disabled = !enabled;
    });
  }

  function renderForm() {
    const item = state.item;

    if (!item) {
      els.title.textContent = '未找到该报名资料';
      els.form.reset();
      setFormFeedback('', false);
      setEditorEnabled(false);
      return;
    }

    document.title = `VIP Admin - VIP #${item.id}`;
    els.title.textContent = `编辑 #${item.id} ${item.nickname || ''}`.trim();
    els.form.elements.nickname.value = item.nickname || '';
    els.form.elements.generation.value = item.generation || '80';
    els.form.elements.gender.value = item.gender || 'm';
    els.form.elements.location.value = item.location || '';
    els.form.elements.join_reason.value = item.join_reason || '';
    els.form.elements.contact_type.value = item.contact_type || '';
    els.form.elements.contact_info.value = item.contact_info || '';
    els.form.elements.contact_qrcode_path.value = item.contact_qrcode_path || '';
    els.form.elements.intro_text.value = item.intro_text || '';
    els.approveToggle.checked = Number(item.is_approved) === 1;

    const isQrcode = item.contact_type === 'qrcode';
    els.contactInfoField.classList.toggle('is-hidden', isQrcode);
    els.qrcodePathField.classList.toggle('is-hidden', !isQrcode);

    if (isQrcode && item.contact_qrcode_path) {
      els.qrcodePreviewImage.src = `/${String(item.contact_qrcode_path).replace(/^\/+/, '')}`;
      els.qrcodePreviewCard.classList.remove('is-hidden');
    } else {
      els.qrcodePreviewImage.src = '';
      els.qrcodePreviewCard.classList.add('is-hidden');
    }

    els.metaCreated.textContent = formatDateTime(item.created_at);
    els.metaUpdated.textContent = formatDateTime(item.updated_at);
    els.metaApprovedBy.textContent = item.approved_by || '--';
    els.metaApprovedAt.textContent = formatDateTime(item.approved_at);
    els.metaIpLocation.textContent = item.ip_lookup_location || item.ip_address || '--';
    els.metaDevice.textContent = [
      item.device_type || '',
      [item.browser_name, item.browser_version].filter(Boolean).join(' '),
      [item.os_name, item.os_version].filter(Boolean).join(' '),
    ].filter(Boolean).join(' · ') || '--';

    setEditorEnabled(true);
  }

  async function apiFetch(path, options, reason) {
    startLoading(reason);
    const headers = new Headers(options && options.headers ? options.headers : {});
    headers.set('Authorization', `Bearer ${state.token}`);

    if (options && options.body) {
      headers.set('Content-Type', 'application/json');
    }

    try {
      auth.debugLog(`vip fetch ${path}`);
      const response = await fetch(path, {
        ...options,
        headers,
      });

      const data = await response.json().catch(() => null);
      auth.debugLog(`vip fetch status ${path} -> ${response.status}`);

      if (!response.ok) {
        if (data && data.data && Array.isArray(data.data.details)) {
          auth.debugLog(`vip fetch details ${data.data.details.join(' | ')}`);
        }
        const error = new Error(data && data.error && data.error.message ? data.error.message : '请求失败。');
        error.status = response.status;
        error.payload = data;
        throw error;
      }

      return data;
    } finally {
      stopLoading();
    }
  }

  async function ensureToken() {
    if (state.token) {
      auth.debugLog('vip token cache hit');
      return;
    }

    auth.debugLog('vip ensureToken start');
    const authState = await auth.requireToken(publishableKey, 'auth_failed');
    if (!authState) {
      throw new Error('Unable to retrieve Clerk token.');
    }

    state.clerk = authState.clerk;
    state.token = authState.token;
  }

  async function checkWhitelist() {
    const data = await apiFetch('/api/vip-admin-whitelist.php', { method: 'GET' }, '正在验证管理员权限...');
    return data && data.data ? data.data : {};
  }

  async function fetchItem() {
    setFormFeedback('正在加载报名资料...', false);
    const data = await apiFetch(`/api/vip-admin-item.php?id=${encodeURIComponent(String(vipId))}`, { method: 'GET' }, '正在获取报名资料...');
    state.item = data && data.data ? data.data.item : null;
    renderForm();
    setFormFeedback('', false);
  }

  async function refreshDashboard() {
    auth.debugLog('vip refreshDashboard start');
    await ensureToken();

    try {
      await checkWhitelist();
      els.signoutButtons.forEach((button) => {
        button.hidden = false;
      });

      await fetchItem();
      setView('dashboard');
    } catch (error) {
      if (error && error.status === 403) {
        auth.debugLog('vip refreshDashboard forbidden');
        els.forbiddenTitle.textContent = '当前账号没有后台权限';
        els.forbiddenMessage.textContent = buildForbiddenMessage(error);
        setView('forbidden');
        return;
      }

      if (error && error.status === 404) {
        auth.debugLog('vip refreshDashboard missing item');
        els.forbiddenTitle.textContent = '未找到该报名资料';
        els.forbiddenMessage.textContent = '请返回 Vips 列表后重新选择。';
        setView('forbidden');
        return;
      }

      if (error && error.status === 401) {
        auth.debugLog(`vip refreshDashboard redirect login -> ${loginRouteWithAuthFailure}`);
        window.location.href = loginRouteWithAuthFailure;
        return;
      }

      auth.debugLog(`vip refreshDashboard failed ${error.message || 'unknown'}`);
      els.forbiddenTitle.textContent = '加载失败';
      els.forbiddenMessage.textContent = error.message || '加载报名资料失败。';
      setView('forbidden');
    }
  }

  async function initDashboardSession() {
    auth.debugLog('vip initDashboardSession start');
    const sessionState = await auth.requireSession(publishableKey, 'auth_failed');
    if (!sessionState) {
      return false;
    }

    auth.debugLog('vip initDashboardSession ok');
    state.clerk = sessionState.clerk;
    return true;
  }

  async function signOut() {
    await auth.signOut(publishableKey);
    state.token = null;
    state.item = null;
    els.signoutButtons.forEach((button) => {
      button.hidden = true;
    });
    window.location.href = loginRoute;
  }

  if (els.drawerToggle) {
    els.drawerToggle.addEventListener('click', toggleDrawer);
  }

  if (els.drawerClose) {
    els.drawerClose.addEventListener('click', closeDrawer);
  }

  if (els.drawerBackdrop) {
    els.drawerBackdrop.addEventListener('click', closeDrawer);
  }

  if (els.drawer) {
    els.drawer.addEventListener('click', (event) => {
      if (event.target.closest('.admin-nav-link')) {
        closeDrawer();
      }
    });
  }

  mobileDrawerQuery.addEventListener('change', (event) => {
    if (!event.matches) {
      closeDrawer();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeDrawer();
    }
  });

  els.retryButton.addEventListener('click', () => {
    refreshDashboard();
  });

  els.signoutButtons.forEach((button) => {
    button.addEventListener('click', () => {
      signOut().catch(() => {
        setFormFeedback('退出时发生异常，请刷新页面重试。', true);
      });
    });
  });

  els.form.elements.contact_type.addEventListener('change', () => {
    const isQrcode = els.form.elements.contact_type.value === 'qrcode';
    els.contactInfoField.classList.toggle('is-hidden', isQrcode);
    els.qrcodePathField.classList.toggle('is-hidden', !isQrcode);
  });

  els.form.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!state.item) {
      return;
    }

    const payload = {
      id: state.item.id,
      nickname: els.form.elements.nickname.value.trim(),
      generation: els.form.elements.generation.value,
      gender: els.form.elements.gender.value,
      location: els.form.elements.location.value.trim(),
      join_reason: els.form.elements.join_reason.value.trim(),
      intro_text: els.form.elements.intro_text.value.trim(),
      contact_type: els.form.elements.contact_type.value,
      contact_info: els.form.elements.contact_info.value.trim(),
      contact_qrcode_path: els.form.elements.contact_qrcode_path.value.trim(),
      is_approved: els.approveToggle.checked,
    };

    els.saveButton.disabled = true;
    setFormFeedback('正在保存修改...', false);

    try {
      await ensureToken();
      await apiFetch('/api/vip-admin-update.php', {
        method: 'POST',
        body: JSON.stringify(payload),
      }, '正在保存修改...');

      setFormFeedback('修改已保存。', false);
      await fetchItem();
    } catch (error) {
      setFormFeedback(error.message || '保存失败。', true);
    } finally {
      els.saveButton.disabled = false;
    }
  });

  renderForm();
  setView('dashboard');

  initDashboardSession()
    .then((isReady) => {
      if (!isReady) {
        return;
      }

      return refreshDashboard();
    })
    .catch((error) => {
      auth.debugLog(`vip init failed ${error && error.message ? error.message : 'unknown'}`);
      els.forbiddenTitle.textContent = 'Clerk 初始化失败';
      els.forbiddenMessage.textContent = error.message || 'Clerk 初始化失败。';
      setView('forbidden');
    });
})();
