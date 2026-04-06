(function () {
  const app = document.querySelector('[data-vip-admin-vip]');

  if (!app) {
    return;
  }

  const state = {
    clerk: null,
    token: null,
    userEmail: '',
    sessionStatus: 'session status checking...',
    viewerRole: '',
    item: null,
    sameFingerprintMembers: [],
    initialSnapshot: '',
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
    usersLinks: Array.from(app.querySelectorAll('[data-admin-users-link]')),
    debugLinks: Array.from(app.querySelectorAll('[data-admin-debug-link]')),
    sessionEmail: app.querySelector('[data-admin-session-email]'),
    sessionStatus: app.querySelector('[data-admin-session-status]'),
    backLinks: Array.from(app.querySelectorAll('[data-admin-back-link]')),
    form: app.querySelector('[data-admin-form]'),
    saveButton: app.querySelector('[data-admin-save]'),
    restoreButton: app.querySelector('[data-admin-restore]'),
    deleteTrigger: app.querySelector('[data-admin-delete-trigger]'),
    title: app.querySelector('[data-editor-title]'),
    feedback: app.querySelector('[data-form-feedback]'),
    approveToggle: app.querySelector('[data-admin-approve-toggle]'),
    contactInfoField: app.querySelector('[data-contact-info-field]'),
    qrcodePathField: app.querySelector('[data-qrcode-path-field]'),
    qrcodeFileInput: app.querySelector('[data-admin-qrcode-file]'),
    qrcodeDropzone: app.querySelector('[data-admin-qrcode-dropzone]'),
    qrcodePreview: app.querySelector('[data-admin-qrcode-preview]'),
    qrcodePreviewImage: app.querySelector('[data-admin-qrcode-preview-image]'),
    qrcodeReplaceButton: app.querySelector('[data-admin-qrcode-replace]'),
    savedModal: app.querySelector('[data-admin-saved-modal]'),
    savedCloseButtons: Array.from(app.querySelectorAll('[data-admin-saved-close]')),
    deleteModal: app.querySelector('[data-admin-delete-modal]'),
    deleteCloseButtons: Array.from(app.querySelectorAll('[data-admin-delete-close]')),
    deleteConfirmButton: app.querySelector('[data-admin-delete-confirm]'),
    restoreModal: app.querySelector('[data-admin-restore-modal]'),
    restoreCloseButtons: Array.from(app.querySelectorAll('[data-admin-restore-close]')),
    restoreConfirmButton: app.querySelector('[data-admin-restore-confirm]'),
    metaCreated: app.querySelector('[data-meta-created]'),
    metaUpdated: app.querySelector('[data-meta-updated]'),
    metaApprovedBy: app.querySelector('[data-meta-approved-by]'),
    metaApprovedAt: app.querySelector('[data-meta-approved-at]'),
    metaIpLocation: app.querySelector('[data-meta-ip-location]'),
    metaFingerprint: app.querySelector('[data-meta-fingerprint]'),
    metaDevice: app.querySelector('[data-meta-device]'),
    metaFingerprintCount: app.querySelector('[data-meta-fingerprint-count]'),
    metaFingerprintMembersWrap: app.querySelector('[data-meta-fingerprint-members-wrap]'),
    metaFingerprintMembers: app.querySelector('[data-meta-fingerprint-members]'),
  };

  const vipId = Number(app.dataset.adminVipId || 0);
  const publishableKey = app.dataset.clerkPublishableKey || '';
  const loginRoute = '/vip/admin/login';
  const loginRouteWithTokenInvalid = `${loginRoute}?reason=token_invalid`;
  const initialParams = new URLSearchParams(window.location.search);
  const cameFromDeleted = initialParams.get('from') === 'deleted';
  const returnTo = sanitizeReturnPath(initialParams.get('return'));
  const mobileDrawerQuery = window.matchMedia('(max-width: 899px)');
  const auth = window.VipAdminAuth;
  let qrcodePreviewUrl = '';

  function sanitizeReturnPath(value) {
    const raw = typeof value === 'string' ? value.trim() : '';
    if (!raw.startsWith('/vip/admin/vips/')) {
      return '';
    }

    return raw;
  }

  function syncBackLinks(isDeleted) {
    const fallbackHref = (Boolean(isDeleted) || cameFromDeleted) ? '/vip/admin/vips/?status=deleted' : '/vip/admin/vips/';
    const href = returnTo || fallbackHref;
    const label = href.includes('status=deleted') ? '返回回收站' : '返回列表';

    els.backLinks.forEach((link) => {
      link.href = href;
      link.textContent = label;
    });
  }

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

  function setSavedModalOpen(isOpen) {
    if (!els.savedModal) {
      return;
    }

    els.savedModal.classList.toggle('is-hidden', !isOpen);
    els.savedModal.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
    document.body.classList.toggle('admin-modal-open', isOpen);
  }

  function setDeleteModalOpen(isOpen) {
    if (!els.deleteModal) {
      return;
    }

    els.deleteModal.classList.toggle('is-hidden', !isOpen);
    els.deleteModal.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
    document.body.classList.toggle('admin-modal-open', isOpen);
  }

  function setRestoreModalOpen(isOpen) {
    if (!els.restoreModal) {
      return;
    }

    els.restoreModal.classList.toggle('is-hidden', !isOpen);
    els.restoreModal.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
    document.body.classList.toggle('admin-modal-open', isOpen);
  }

  function getFormSnapshot() {
    return JSON.stringify({
      nickname: els.form.elements.nickname.value.trim(),
      generation: els.form.elements.generation.value,
      gender: els.form.elements.gender.value,
      location: els.form.elements.location.value.trim(),
      join_reason: els.form.elements.join_reason.value.trim(),
      intro_text: els.form.elements.intro_text.value.trim(),
      contact_type: els.form.elements.contact_type.value,
      contact_info: els.form.elements.contact_info.value.trim(),
      contact_qrcode_path: els.form.elements.contact_qrcode_path.value.trim(),
      is_approved: Boolean(els.approveToggle.checked),
    });
  }

  function syncDirtyState() {
    const isDirty = state.initialSnapshot !== '' && getFormSnapshot() !== state.initialSnapshot;
    if (els.saveButton) {
      els.saveButton.disabled = !isDirty;
    }
  }

  function syncDeletedActions(isDeleted) {
    if (els.saveButton) {
      els.saveButton.classList.toggle('is-hidden', isDeleted);
    }
    if (els.restoreButton) {
      els.restoreButton.classList.toggle('is-hidden', !isDeleted);
      els.restoreButton.disabled = !isDeleted;
    }
    if (els.deleteTrigger) {
      els.deleteTrigger.classList.toggle('is-hidden', isDeleted);
    }
  }

  async function deleteVip() {
    if (!state.item) {
      return;
    }

    await ensureToken();
    await apiFetch('/api/vip-admin-delete.php', {
      method: 'POST',
      body: JSON.stringify({ id: state.item.id }),
    }, '正在移到回收站...');
  }

  async function restoreVip() {
    if (!state.item) {
      return;
    }

    await ensureToken();
    await apiFetch('/api/vip-admin-restore.php', {
      method: 'POST',
      body: JSON.stringify({ id: state.item.id }),
    }, '正在恢复 VIP...');
  }

  function clearQrcodePreview() {
    if (qrcodePreviewUrl) {
      URL.revokeObjectURL(qrcodePreviewUrl);
      qrcodePreviewUrl = '';
    }

    if (els.qrcodePreviewImage) {
      els.qrcodePreviewImage.src = '';
    }
    if (els.qrcodePreview) {
      els.qrcodePreview.hidden = true;
    }
    if (els.qrcodeDropzone) {
      els.qrcodeDropzone.hidden = false;
    }
  }

  function showQrcodePreview(path) {
    clearQrcodePreview();
    if (!path) {
      return;
    }

    if (els.qrcodePreviewImage) {
      els.qrcodePreviewImage.src = `/${String(path).replace(/^\/+/, '')}`;
    }
    if (els.qrcodePreview) {
      els.qrcodePreview.hidden = false;
    }
    if (els.qrcodeDropzone) {
      els.qrcodeDropzone.hidden = true;
    }
  }

  async function uploadQrcode(file) {
    const formData = new FormData();
    formData.append('contact_qrcode', file);

    startLoading('正在上传二维码...');
    const headers = new Headers();
    headers.set('Authorization', `Bearer ${state.token}`);
    headers.set('X-Clerk-Token', state.token);
    headers.set('X-Clerk-User-Email', state.userEmail);

    try {
      const response = await fetch('/api/vip-admin-upload-qrcode.php', {
        method: 'POST',
        headers,
        body: formData,
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        const error = new Error(data && data.error && data.error.message ? data.error.message : '二维码上传失败。');
        error.status = response.status;
        throw error;
      }

      return data;
    } finally {
      stopLoading();
    }
  }

  function syncUsersNav() {
    if (!state.viewerRole) {
      return;
    }

    const isAdmin = state.viewerRole === 'admin';
    els.usersLinks.forEach((link) => {
      link.classList.toggle('is-hidden', !isAdmin);
    });
    els.debugLinks.forEach((link) => {
      link.classList.toggle('is-hidden', !isAdmin);
    });
  }

  function syncSessionEmail() {
    if (!els.sessionEmail) {
      return;
    }

    els.sessionEmail.textContent = state.userEmail ? `logged in as ${state.userEmail}` : 'logged in as ...';
    if (els.sessionStatus) {
      els.sessionStatus.textContent = state.sessionStatus || 'session status checking...';
    }
  }

  function formatDateTime(value, fallback) {
    if (!value) {
      return fallback || '--';
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

  function formatFingerprint(value) {
    const fingerprint = String(value || '').trim();
    if (!fingerprint) {
      return '暂无数据';
    }

    if (fingerprint.length <= 10) {
      return fingerprint;
    }

    return `${fingerprint.slice(0, 10)}...`;
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function setEditorEnabled(enabled) {
    const controls = els.form.querySelectorAll('input, select, textarea, button');
    controls.forEach((control) => {
      if (control === els.saveButton) {
        control.disabled = true;
        return;
      }
      if (control === els.restoreButton) {
        control.disabled = enabled;
        return;
      }

      control.disabled = !enabled;
    });
  }

  function renderForm() {
    const item = state.item;
    const sameFingerprintMembers = Array.isArray(state.sameFingerprintMembers) ? state.sameFingerprintMembers : [];

    if (!item) {
      els.title.textContent = '未找到该报名资料';
      els.form.reset();
      setFormFeedback('', false);
      setEditorEnabled(false);
      syncBackLinks(false);
      syncDeletedActions(false);
      if (els.deleteTrigger) {
        els.deleteTrigger.disabled = true;
      }
      state.initialSnapshot = '';
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
    if (els.qrcodeFileInput) {
      els.qrcodeFileInput.value = '';
    }

    if (isQrcode && item.contact_qrcode_path) {
      showQrcodePreview(item.contact_qrcode_path);
    } else {
      clearQrcodePreview();
    }

    els.metaCreated.textContent = formatDateTime(item.created_at, '暂无数据');
    els.metaUpdated.textContent = formatDateTime(item.updated_at, '暂无数据');
    els.metaApprovedBy.textContent = item.approved_by || '暂无数据';
    els.metaApprovedAt.textContent = formatDateTime(item.approved_at, Number(item.is_approved) === 1 ? '暂无记录' : '未审核');
    els.metaIpLocation.textContent = item.ip_lookup_location || item.ip_address || '暂无数据';
    els.metaFingerprint.textContent = formatFingerprint(item.fingerprint);
    els.metaDevice.textContent = [
      item.device_type || '',
      [item.browser_name, item.browser_version].filter(Boolean).join(' '),
      [item.os_name, item.os_version].filter(Boolean).join(' '),
    ].filter(Boolean).join(' · ') || '暂无数据';
    els.metaFingerprintCount.textContent = item.fingerprint ? String(Number(item.same_fingerprint_count || 0)) : '暂无数据';
    if (els.metaFingerprintMembersWrap && els.metaFingerprintMembers) {
      const shouldShowRelated = sameFingerprintMembers.length > 0 && Number(item.same_fingerprint_count || 0) > 1;
      els.metaFingerprintMembersWrap.classList.toggle('is-hidden', !shouldShowRelated);
      if (shouldShowRelated) {
        els.metaFingerprintMembers.innerHTML = sameFingerprintMembers.map((member) => `
          <li class="meta-related-item">
            <a class="meta-related-link" href="/vip/admin/vip/${Number(member.id)}?${new URLSearchParams({
              ...(Number(member.is_deleted) === 1 ? { from: 'deleted' } : {}),
              ...(returnTo ? { return: returnTo } : {}),
            }).toString()}">
              #${Number(member.id)} ${escapeHtml(member.nickname || '未命名成员')}
            </a>
          </li>
        `).join('');
      } else {
        els.metaFingerprintMembers.innerHTML = '';
      }
    }

    const isDeleted = Number(item.is_deleted) === 1;
    syncBackLinks(isDeleted);
    syncDeletedActions(isDeleted);
    setEditorEnabled(!isDeleted);
    if (els.deleteTrigger) {
      els.deleteTrigger.disabled = isDeleted;
    }
    state.initialSnapshot = getFormSnapshot();
    syncDirtyState();

    if (isDeleted) {
      setFormFeedback('该资料当前位于回收站中，暂时只读。', false);
    } else {
      setFormFeedback('', false);
    }
  }

  async function apiFetch(path, options, reason) {
    startLoading(reason);
    await ensureToken();
    const headers = new Headers(options && options.headers ? options.headers : {});
    headers.set('Authorization', `Bearer ${state.token}`);
    headers.set('X-Clerk-Token', state.token);
    headers.set('X-Clerk-User-Email', state.userEmail);

    if (options && options.body) {
      headers.set('Content-Type', 'application/json');
    }

    try {
      auth.debugLog(`vip fetch ${path}`);
      const response = await fetch(path, {
        ...options,
        cache: 'no-store',
        headers,
      });

      const data = await response.json().catch(() => null);
      auth.debugLog(`vip fetch status ${path} -> ${response.status}`);

      if (!response.ok) {
        if (data && data.error && data.error.code) {
          auth.debugLog(`vip fetch error_code ${path} -> ${data.error.code}`);
        }
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
    auth.debugLog('vip ensureToken start');
    const authState = await auth.requireToken(publishableKey, 'need_login');
    if (!authState) {
      throw new Error('Unable to retrieve Clerk token.');
    }

    state.clerk = authState.clerk;
    state.token = authState.token;
    state.userEmail = authState.userEmail || '';
    state.sessionStatus = auth.describeSessionToken(authState.token);
    syncSessionEmail();
  }

  async function fetchItem() {
    setFormFeedback('正在加载报名资料...', false);
    const data = await apiFetch(`/api/vip-admin-item.php?id=${encodeURIComponent(String(vipId))}`, { method: 'GET' }, '正在获取报名资料...');
    state.item = data && data.data ? data.data.item : null;
    state.sameFingerprintMembers = Array.isArray(data && data.data ? data.data.same_fingerprint_members : null) ? data.data.same_fingerprint_members : [];
    state.viewerRole = String(data && data.data && data.data.viewer ? data.data.viewer.role || '' : '');
    syncUsersNav();
    renderForm();
  }

  async function refreshDashboard() {
    auth.debugLog('vip refreshDashboard start');
    await ensureToken();

    try {
      els.signoutButtons.forEach((button) => {
        button.hidden = false;
      });

      await fetchItem();
      setView('dashboard');
    } catch (error) {
      if (error && error.status === 403) {
        auth.debugLog('vip refreshDashboard forbidden');
        auth.redirectToAccessDenied('not_whitelisted');
        return;
      }

      if (error && error.status === 404) {
        auth.debugLog('vip refreshDashboard missing item');
        els.forbiddenTitle.textContent = '未找到该报名资料';
        els.forbiddenMessage.textContent = cameFromDeleted ? '请返回回收站后重新选择。' : '请返回 Vips 列表后重新选择。';
        syncBackLinks(false);
        setView('forbidden');
        return;
      }

      if (error && error.status === 401) {
        auth.debugLog(`vip refreshDashboard redirect login -> ${loginRouteWithTokenInvalid}`);
        window.location.href = loginRouteWithTokenInvalid;
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
    const sessionState = await auth.requireSession(publishableKey, 'need_login');
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
      if (els.savedModal && !els.savedModal.classList.contains('is-hidden')) {
        setSavedModalOpen(false);
        return;
      }
      if (els.deleteModal && !els.deleteModal.classList.contains('is-hidden')) {
        setDeleteModalOpen(false);
        return;
      }
      if (els.restoreModal && !els.restoreModal.classList.contains('is-hidden')) {
        setRestoreModalOpen(false);
        return;
      }
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

  els.savedCloseButtons.forEach((button) => {
    button.addEventListener('click', () => {
      setSavedModalOpen(false);
    });
  });

  if (els.deleteTrigger) {
    els.deleteTrigger.addEventListener('click', () => {
      setDeleteModalOpen(true);
    });
  }

  els.deleteCloseButtons.forEach((button) => {
    button.addEventListener('click', () => {
      setDeleteModalOpen(false);
    });
  });

  if (els.deleteConfirmButton) {
    els.deleteConfirmButton.addEventListener('click', async () => {
      els.deleteConfirmButton.disabled = true;
      setFormFeedback('正在移到回收站...', false);

      try {
        await deleteVip();
        window.location.href = returnTo || '/vip/admin/vips/?status=deleted';
      } catch (error) {
        setDeleteModalOpen(false);
        setFormFeedback(error.message || '删除失败。', true);
      } finally {
        els.deleteConfirmButton.disabled = false;
      }
    });
  }

  if (els.restoreButton) {
    els.restoreButton.addEventListener('click', () => {
      setRestoreModalOpen(true);
    });
  }

  els.restoreCloseButtons.forEach((button) => {
    button.addEventListener('click', () => {
      setRestoreModalOpen(false);
    });
  });

  if (els.restoreConfirmButton) {
    els.restoreConfirmButton.addEventListener('click', async () => {
      els.restoreConfirmButton.disabled = true;
      setFormFeedback('正在恢复 VIP...', false);

      try {
        await restoreVip();
        window.location.href = `/vip/admin/vip/${encodeURIComponent(String(vipId))}`;
      } catch (error) {
        setRestoreModalOpen(false);
        setFormFeedback(error.message || '恢复失败。', true);
      } finally {
        els.restoreConfirmButton.disabled = false;
      }
    });
  }

  els.form.elements.contact_type.addEventListener('change', () => {
    const isQrcode = els.form.elements.contact_type.value === 'qrcode';
    els.contactInfoField.classList.toggle('is-hidden', isQrcode);
    els.qrcodePathField.classList.toggle('is-hidden', !isQrcode);

    if (!isQrcode) {
      els.form.elements.contact_qrcode_path.value = '';
      if (els.qrcodeFileInput) {
        els.qrcodeFileInput.value = '';
      }
      clearQrcodePreview();
    }

    syncDirtyState();
  });

  if (els.qrcodeFileInput) {
    els.qrcodeFileInput.addEventListener('change', async () => {
      const [file] = Array.from(els.qrcodeFileInput.files || []);
      if (!file) {
        return;
      }

      setFormFeedback('正在上传二维码...', false);

      try {
        await ensureToken();
        const data = await uploadQrcode(file);
        const uploadedPath = String(data && data.data ? data.data.path || '' : '');
        if (!uploadedPath) {
          throw new Error('二维码上传后未返回文件路径。');
        }

        els.form.elements.contact_qrcode_path.value = uploadedPath;
        clearQrcodePreview();
        qrcodePreviewUrl = URL.createObjectURL(file);
        els.qrcodePreviewImage.src = qrcodePreviewUrl;
        els.qrcodePreview.hidden = false;
        els.qrcodeDropzone.hidden = true;
        setFormFeedback('二维码已上传。', false);
        syncDirtyState();
      } catch (error) {
        els.qrcodeFileInput.value = '';
        setFormFeedback(error.message || '二维码上传失败。', true);
      }
    });
  }

  if (els.qrcodeReplaceButton) {
    els.qrcodeReplaceButton.addEventListener('click', () => {
      els.form.elements.contact_qrcode_path.value = '';
      if (els.qrcodeFileInput) {
        els.qrcodeFileInput.value = '';
        clearQrcodePreview();
        els.qrcodeFileInput.click();
      }
      syncDirtyState();
    });
  }

  ['nickname', 'generation', 'gender', 'location', 'join_reason', 'contact_type', 'contact_info', 'contact_qrcode_path', 'intro_text'].forEach((fieldName) => {
    const field = els.form.elements[fieldName];
    if (!field) {
      return;
    }

    field.addEventListener('input', syncDirtyState);
    field.addEventListener('change', syncDirtyState);
  });

  els.approveToggle.addEventListener('change', syncDirtyState);

  els.form.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!state.item || els.saveButton.disabled) {
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

      state.initialSnapshot = getFormSnapshot();
      syncDirtyState();
      setFormFeedback('', false);
      setSavedModalOpen(true);
      await fetchItem();
    } catch (error) {
      setFormFeedback(error.message || '保存失败。', true);
    } finally {
      syncDirtyState();
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
