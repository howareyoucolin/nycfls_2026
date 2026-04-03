(function () {
  const app = document.querySelector('[data-vip-admin-users]');

  if (!app) {
    return;
  }

  const state = {
    clerk: null,
    token: null,
    userEmail: '',
    users: [],
    pendingRemovalId: 0,
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
    signoutButtons: Array.from(app.querySelectorAll('[data-admin-signout]')).filter(Boolean),
    sessionEmail: app.querySelector('[data-admin-session-email]'),
    form: app.querySelector('[data-user-form]'),
    saveButton: app.querySelector('[data-user-save]'),
    feedback: app.querySelector('[data-user-feedback]'),
    list: app.querySelector('[data-users-list]'),
    removeModal: app.querySelector('[data-user-remove-modal]'),
    removeCopy: app.querySelector('[data-user-remove-copy]'),
    removeConfirmButton: app.querySelector('[data-user-remove-confirm]'),
    removeCancelButtons: Array.from(app.querySelectorAll('[data-user-remove-cancel]')).filter(Boolean),
  };

  const publishableKey = app.dataset.clerkPublishableKey || '';
  const loginRoute = '/vip/admin/login';
  const loginRouteWithTokenInvalid = `${loginRoute}?reason=token_invalid`;
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

  function setFeedback(message, isError) {
    els.feedback.textContent = message || '';
    els.feedback.style.color = isError ? '#c64d34' : '#6c5b4d';
  }

  function syncSessionEmail() {
    if (!els.sessionEmail) {
      return;
    }

    els.sessionEmail.textContent = state.userEmail ? `logged in as ${state.userEmail}` : 'logged in as ...';
  }

  function openRemoveModal(userId) {
    const user = state.users.find((item) => Number(item.id) === Number(userId));
    if (!user || !els.removeModal) {
      return;
    }

    state.pendingRemovalId = Number(user.id);
    if (els.removeCopy) {
      els.removeCopy.textContent = `确认移除 ${user.whitelisted_email || '该用户'} 吗？移除后，该账号将无法继续访问后台。`;
    }
    els.removeModal.classList.remove('is-hidden');
    els.removeModal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('admin-modal-open');
  }

  function closeRemoveModal() {
    state.pendingRemovalId = 0;
    if (!els.removeModal) {
      return;
    }

    els.removeModal.classList.add('is-hidden');
    els.removeModal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('admin-modal-open');
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function formatEmailLines(email) {
    const normalized = String(email || '').trim();
    const atIndex = normalized.indexOf('@');

    if (atIndex <= 0) {
      return {
        local: normalized,
        domain: '',
      };
    }

    return {
      local: normalized.slice(0, atIndex),
      domain: normalized.slice(atIndex),
    };
  }

  function renderUsers() {
    if (!state.users.length) {
      els.list.innerHTML = '<p class="users-empty">当前还没有用户。</p>';
      return;
    }

    els.list.innerHTML = state.users.map((user) => {
      const emailLines = formatEmailLines(user.whitelisted_email || '');

      return `
        <article class="user-row">
          <div class="user-email-block">
            <strong class="user-email-local">${escapeHtml(emailLines.local)}</strong>
            <strong class="user-email-domain">${escapeHtml(emailLines.domain)}</strong>
          </div>
          <div class="user-row-bottom">
            <span class="user-role-badge">${escapeHtml(user.role === 'admin' ? '超级管理人员' : '管理人员')}</span>
            <button
              type="button"
              class="ghost-button user-remove-button"
              data-remove-user-id="${Number(user.id)}"
              aria-label="移除用户"
              title="移除用户"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M9 3h6" />
                <path d="M5 6h14" />
                <path d="M8 6v12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6" />
                <path d="M10 10v6" />
                <path d="M14 10v6" />
              </svg>
            </button>
          </div>
        </article>
      `;
    }).join('');
  }

  async function apiFetch(path, options, reason) {
    startLoading(reason);
    const headers = new Headers(options && options.headers ? options.headers : {});
    headers.set('Authorization', `Bearer ${state.token}`);
    headers.set('X-Clerk-Token', state.token);
    headers.set('X-Clerk-User-Email', state.userEmail);

    if (options && options.body) {
      headers.set('Content-Type', 'application/json');
    }

    try {
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
    } finally {
      stopLoading();
    }
  }

  async function ensureToken() {
    if (state.token) {
      return;
    }

    const authState = await auth.requireToken(publishableKey, 'need_login');
    if (!authState) {
      throw new Error('无法获取 Clerk 登录令牌。');
    }

    state.clerk = authState.clerk;
    state.token = authState.token;
    state.userEmail = authState.userEmail || '';
    syncSessionEmail();
  }

  async function loadUsers() {
    const data = await apiFetch('/api/vip-admin-users.php', { method: 'GET' }, '正在获取用户列表...');
    state.users = Array.isArray(data.data && data.data.items) ? data.data.items : [];
    renderUsers();
  }

  async function refreshDashboard() {
    await ensureToken();

    try {
      els.signoutButtons.forEach((button) => {
        button.hidden = false;
      });

      await loadUsers();
      setFeedback('', false);
      setView('dashboard');
    } catch (error) {
      if (error && error.status === 403) {
        els.forbiddenTitle.textContent = '无权访问';
        els.forbiddenMessage.textContent = '只有管理员可以访问用户管理页面。';
        setView('forbidden');
        return;
      }

      if (error && error.status === 401) {
        window.location.href = loginRouteWithTokenInvalid;
        return;
      }

      setView('dashboard');
      setFeedback(error.message || '加载用户列表失败。', true);
    }
  }

  async function initDashboardSession() {
    const sessionState = await auth.requireSession(publishableKey, 'need_login');
    if (!sessionState) {
      return false;
    }

    state.clerk = sessionState.clerk;
    return true;
  }

  async function signOut() {
    await auth.signOut(publishableKey);
    state.token = null;
    state.users = [];
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
      if (els.removeModal && !els.removeModal.classList.contains('is-hidden')) {
        closeRemoveModal();
        return;
      }
      closeDrawer();
    }
  });

  if (els.retryButton) {
    els.retryButton.addEventListener('click', () => {
      refreshDashboard().catch((error) => {
        els.forbiddenMessage.textContent = error.message || '重新验证失败。';
      });
    });
  }

  els.signoutButtons.forEach((button) => {
    button.addEventListener('click', () => {
      signOut().catch(() => {
        setFeedback('退出时发生异常，请刷新页面重试。', true);
      });
    });
  });

  els.removeCancelButtons.forEach((button) => {
    button.addEventListener('click', () => {
      closeRemoveModal();
    });
  });

  if (els.removeConfirmButton) {
    els.removeConfirmButton.addEventListener('click', async () => {
      const userId = state.pendingRemovalId;
      if (!Number.isFinite(userId) || userId <= 0) {
        closeRemoveModal();
        return;
      }

      els.removeConfirmButton.disabled = true;
      setFeedback('正在移除用户...', false);

      try {
        await ensureToken();
        await apiFetch('/api/vip-admin-user-delete.php', {
          method: 'POST',
          body: JSON.stringify({ id: userId }),
        }, '正在移除用户...');
        closeRemoveModal();
        await loadUsers();
        setFeedback('用户已移除。', false);
      } catch (error) {
        setFeedback(error.message || '移除用户失败。', true);
      } finally {
        els.removeConfirmButton.disabled = false;
      }
    });
  }

  if (els.form) {
    els.form.addEventListener('submit', async (event) => {
      event.preventDefault();

      const payload = {
        email: els.form.elements.email.value.trim(),
        role: els.form.elements.role.value || 'manager',
      };

      els.saveButton.disabled = true;
      setFeedback('正在保存用户...', false);

      try {
        await ensureToken();
        await apiFetch('/api/vip-admin-user-save.php', {
          method: 'POST',
          body: JSON.stringify(payload),
        }, '正在保存用户...');
        els.form.reset();
        els.form.elements.role.value = 'manager';
        await loadUsers();
        setFeedback('用户已保存。', false);
      } catch (error) {
        setFeedback(error.message || '保存用户失败。', true);
      } finally {
        els.saveButton.disabled = false;
      }
    });
  }

  if (els.list) {
    els.list.addEventListener('click', async (event) => {
      const button = event.target.closest('[data-remove-user-id]');
      if (!button) {
        return;
      }

      const userId = Number(button.getAttribute('data-remove-user-id') || '0');
      if (!Number.isFinite(userId) || userId <= 0) {
        return;
      }
      openRemoveModal(userId);
    });
  }

  renderUsers();
  setView('dashboard');

  initDashboardSession()
    .then((isReady) => {
      if (!isReady) {
        return;
      }

      return refreshDashboard();
    })
    .catch((error) => {
      els.forbiddenTitle.textContent = 'Clerk 初始化失败';
      els.forbiddenMessage.textContent = error.message || 'Clerk 初始化失败。';
      setView('forbidden');
    });
})();
