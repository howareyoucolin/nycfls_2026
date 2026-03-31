(function () {
  const app = document.querySelector('[data-vip-admin-app]');

  if (!app) {
    return;
  }

  const state = {
    clerk: null,
    token: null,
    items: [],
    selectedId: null,
    counts: { all: 0, pending: 0, approved: 0 },
  };

  const els = {
    forbiddenState: app.querySelector('[data-forbidden-state]'),
    dashboard: app.querySelector('[data-dashboard]'),
    forbiddenMessage: app.querySelector('[data-forbidden-message]'),
    search: app.querySelector('[data-admin-search]'),
    status: app.querySelector('[data-admin-status]'),
    counts: app.querySelector('[data-admin-counts]'),
    list: app.querySelector('[data-signup-list]'),
    listFeedback: app.querySelector('[data-list-feedback]'),
    refreshButton: app.querySelector('[data-admin-refresh]'),
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

  const publishableKey = app.dataset.clerkPublishableKey || '';
  const clerkScriptSrc = 'https://trusted-albacore-0.clerk.accounts.dev/npm/@clerk/clerk-js@5/dist/clerk.browser.js';
  const loginRoute = '/vip/admin/login';

  function setView(view) {
    if (els.forbiddenState) {
      els.forbiddenState.classList.toggle('is-hidden', view !== 'forbidden');
    }
    if (els.dashboard) {
      els.dashboard.classList.toggle('is-hidden', view !== 'dashboard');
    }
  }

  function setFormFeedback(message, isError) {
    els.feedback.textContent = message || '';
    els.feedback.style.color = isError ? '#ffc0b2' : 'rgba(238, 235, 228, 0.78)';
  }

  function setListFeedback(message, isError) {
    els.listFeedback.textContent = message || '';
    els.listFeedback.style.color = isError ? '#ffc0b2' : 'rgba(238, 235, 228, 0.78)';
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

    if (!details.length) {
      details.push('Backend token did not expose an email claim.');
    }

    return `${baseMessage}\n${details.join('\n')}`;
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

  function escapeHtml(value) {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function selectedItem() {
    return state.items.find((item) => Number(item.id) === Number(state.selectedId)) || null;
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

  function updateCounts() {
    els.counts.innerHTML = [
      `全部 ${state.counts.all || 0}`,
      `待审核 ${state.counts.pending || 0}`,
      `已审核 ${state.counts.approved || 0}`,
    ].map((text) => `<span>${escapeHtml(text)}</span>`).join('');
  }

  function renderList() {
    if (!state.items.length) {
      els.list.innerHTML = '';
      setListFeedback('当前筛选条件下没有数据。', false);
      return;
    }

    setListFeedback('', false);
    els.list.innerHTML = state.items.map((item) => {
      const isActive = Number(item.id) === Number(state.selectedId);
      const statusClass = Number(item.is_approved) === 1 ? 'is-approved' : 'is-pending';
      const statusLabel = Number(item.is_approved) === 1 ? '已审核' : '待审核';
      const meta = [item.generation ? `${item.generation}后` : '', item.location || ''].filter(Boolean).join(' · ');

      return `
        <button type="button" class="signup-item ${isActive ? 'is-active' : ''}" data-item-id="${Number(item.id)}">
          <div class="signup-item-top">
            <div>
              <strong>${escapeHtml(item.nickname || `#${item.id}`)}</strong>
              <div>${escapeHtml(meta || '未填写')}</div>
            </div>
            <span class="signup-item-status ${statusClass}">${statusLabel}</span>
          </div>
          <div class="signup-item-meta">
            <span>#${Number(item.id)}</span>
            <span>${escapeHtml(formatDateTime(item.created_at))}</span>
          </div>
        </button>
      `;
    }).join('');
  }

  function renderForm() {
    const item = selectedItem();

    if (!item) {
      els.title.textContent = '请选择一条报名资料';
      els.form.reset();
      setFormFeedback('', false);
      setEditorEnabled(false);
      els.contactInfoField.classList.remove('is-hidden');
      els.qrcodePathField.classList.add('is-hidden');
      els.qrcodePreviewCard.classList.add('is-hidden');
      [
        els.metaCreated,
        els.metaUpdated,
        els.metaApprovedBy,
        els.metaApprovedAt,
        els.metaIpLocation,
        els.metaDevice,
      ].forEach((node) => {
        node.textContent = '--';
      });
      return;
    }

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

  async function apiFetch(path, options) {
    const headers = new Headers(options && options.headers ? options.headers : {});
    headers.set('Authorization', `Bearer ${state.token}`);

    if (options && options.body) {
      headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(path, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const error = new Error(data && data.error && data.error.message ? data.error.message : '请求失败。');
      error.status = response.status;
      error.payload = data;
      throw error;
    }

    return data;
  }

  async function checkWhitelist() {
    const data = await apiFetch('/api/vip-admin-whitelist.php', { method: 'GET' });
    return data && data.data ? data.data : {};
  }

  async function fetchItems() {
    const query = new URLSearchParams({
      status: els.status.value,
      search: els.search.value.trim(),
    });

    setListFeedback('正在加载报名数据...', false);

    const data = await apiFetch(`/api/vip-admin-list.php?${query.toString()}`, { method: 'GET' });
    state.items = Array.isArray(data.data && data.data.items) ? data.data.items : [];
    state.counts = data.data && data.data.counts ? data.data.counts : state.counts;
    updateCounts();

    if (!state.items.some((item) => Number(item.id) === Number(state.selectedId))) {
      state.selectedId = state.items.length ? state.items[0].id : null;
    }

    renderList();
    renderForm();
  }

  async function ensureToken() {
    if (!state.clerk) {
      throw new Error('Clerk is not ready.');
    }

    const session = state.clerk.session;
    if (!session || typeof session.getToken !== 'function') {
      throw new Error('No active Clerk session.');
    }

    const token = await session.getToken();
    if (!token) {
      throw new Error('Unable to retrieve Clerk token.');
    }

    state.token = token;
  }

  async function refreshDashboard() {
    await ensureToken();

    try {
      const access = await checkWhitelist();
      els.signoutButtons.forEach((button) => {
        button.hidden = false;
      });

      await fetchItems();
      setView('dashboard');
    } catch (error) {
      if (error && error.status === 403) {
        els.forbiddenMessage.textContent = buildForbiddenMessage(error);
        setView('forbidden');
        return;
      }

      if (error && error.status === 401) {
        window.location.href = loginRoute;
        return;
      }

      setView('dashboard');
      setListFeedback(error.message || '加载报名数据失败。', true);
    }
  }

  function createClerkInstance() {
    if (!window.Clerk) {
      throw new Error('Clerk script is unavailable.');
    }
    return window.Clerk;
  }

  function loadScript(src, attributes) {
    return new Promise((resolve, reject) => {
      if (window.Clerk) {
        resolve();
        return;
      }

      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing) {
        existing.addEventListener('load', resolve, { once: true });
        existing.addEventListener('error', reject, { once: true });
        return;
      }

      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.crossOrigin = 'anonymous';
      if (attributes && typeof attributes === 'object') {
        Object.entries(attributes).forEach(([name, value]) => {
          if (typeof value === 'string' && value !== '') {
            script.setAttribute(name, value);
          }
        });
      }
      script.addEventListener('load', resolve, { once: true });
      script.addEventListener('error', () => reject(new Error('Failed to load Clerk script.')), { once: true });
      document.head.appendChild(script);
    });
  }

  async function initDashboardSession() {
    if (!publishableKey) {
      throw new Error('缺少 Clerk publishable key，请先直接在代码里补上。');
    }

    await loadScript(clerkScriptSrc, {
      'data-clerk-publishable-key': publishableKey,
    });

    state.clerk = createClerkInstance();

    if (typeof state.clerk.load === 'function') {
      await state.clerk.load({
        publishableKey,
      });
    }

    if (!state.clerk.session) {
      window.location.href = loginRoute;
      return false;
    }

    return true;
  }

  async function signOut() {
    if (state.clerk && typeof state.clerk.signOut === 'function') {
      await state.clerk.signOut();
    }

    state.token = null;
    state.items = [];
    state.selectedId = null;
    els.signoutButtons.forEach((button) => {
      button.hidden = true;
    });
    renderList();
    renderForm();
    window.location.href = loginRoute;
  }

  els.list.addEventListener('click', (event) => {
    const button = event.target.closest('[data-item-id]');
    if (!button) {
      return;
    }

    state.selectedId = Number(button.getAttribute('data-item-id'));
    renderList();
    renderForm();
  });

  els.refreshButton.addEventListener('click', () => {
    refreshDashboard().catch((error) => {
      setListFeedback(error.message || '刷新失败。', true);
    });
  });

  els.retryButton.addEventListener('click', () => {
    refreshDashboard().catch((error) => {
      els.forbiddenMessage.textContent = buildForbiddenMessage(error);
    });
  });

  els.signoutButtons.forEach((button) => {
    button.addEventListener('click', () => {
      signOut().catch(() => {
        setListFeedback('退出时发生异常，请刷新页面重试。', true);
      });
    });
  });

  els.search.addEventListener('input', () => {
    window.clearTimeout(els.search._debounceTimer);
    els.search._debounceTimer = window.setTimeout(() => {
      refreshDashboard().catch((error) => {
        setListFeedback(error.message || '搜索失败。', true);
      });
    }, 250);
  });

  els.status.addEventListener('change', () => {
    refreshDashboard().catch((error) => {
      setListFeedback(error.message || '筛选失败。', true);
    });
  });

  els.form.elements.contact_type.addEventListener('change', () => {
    const isQrcode = els.form.elements.contact_type.value === 'qrcode';
    els.contactInfoField.classList.toggle('is-hidden', isQrcode);
    els.qrcodePathField.classList.toggle('is-hidden', !isQrcode);
  });

  els.form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const item = selectedItem();
    if (!item) {
      return;
    }

    const payload = {
      id: item.id,
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
      });

      setFormFeedback('修改已保存。', false);
      await fetchItems();
    } catch (error) {
      setFormFeedback(error.message || '保存失败。', true);
    } finally {
      els.saveButton.disabled = false;
    }
  });

  renderForm();
  updateCounts();
  setView('dashboard');

  initDashboardSession()
    .then((isReady) => {
      if (!isReady) {
        return;
      }

      return refreshDashboard();
    })
    .catch((error) => {
      setView('forbidden');
      els.forbiddenMessage.textContent = error.message || 'Clerk 初始化失败。';
  });
})();
