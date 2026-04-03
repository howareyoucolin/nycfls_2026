(function () {
  const app = document.querySelector('[data-vip-admin-debug]');

  if (!app) {
    return;
  }

  const state = {
    clerk: null,
    token: null,
    userEmail: '',
    logs: [],
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
    usersLinks: Array.from(app.querySelectorAll('[data-admin-users-link]')).filter(Boolean),
    debugLinks: Array.from(app.querySelectorAll('[data-admin-debug-link]')).filter(Boolean),
    sessionEmail: app.querySelector('[data-admin-session-email]'),
    feedback: app.querySelector('[data-debug-feedback]'),
    list: app.querySelector('[data-debug-log-list]'),
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
    if (!els.feedback) {
      return;
    }

    els.feedback.textContent = message || '';
    els.feedback.style.color = isError ? '#c64d34' : '#6c5b4d';
  }

  function syncSessionEmail() {
    if (!els.sessionEmail) {
      return;
    }

    els.sessionEmail.textContent = state.userEmail ? `logged in as ${state.userEmail}` : 'logged in as ...';
  }

  function syncAdminNav() {
    els.usersLinks.forEach((link) => {
      link.classList.remove('is-hidden');
    });
    els.debugLinks.forEach((link) => {
      link.classList.remove('is-hidden');
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

  function renderLogs() {
    if (!els.list) {
      return;
    }

    if (!state.logs.length) {
      els.list.innerHTML = `
        <div class="signup-empty-state debug-empty-state">
          <div class="signup-empty-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 4h12v16H6z" />
              <path d="M9 8h6" />
              <path d="M9 12h6" />
              <path d="M9 16h4" />
            </svg>
          </div>
          <p class="signup-empty-title">当前还没有调试日志。</p>
        </div>
      `;
      return;
    }

    els.list.innerHTML = state.logs.map((line) => `
      <article class="debug-log-row">
        <pre class="debug-log-line">${escapeHtml(line)}</pre>
      </article>
    `).join('');
  }

  async function apiFetch(path, options, reason) {
    startLoading(reason);
    const headers = new Headers(options && options.headers ? options.headers : {});
    headers.set('Authorization', `Bearer ${state.token}`);
    headers.set('X-Clerk-Token', state.token);
    headers.set('X-Clerk-User-Email', state.userEmail);

    try {
      const response = await fetch(path, {
        ...options,
        cache: 'no-store',
        headers,
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const error = new Error(data && data.error && data.error.message ? data.error.message : '请求失败。');
        error.status = response.status;
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

  async function loadLogs() {
    await apiFetch('/api/vip-admin-users.php', { method: 'GET' }, '正在验证管理员权限...');
    state.logs = typeof auth.getDebugLogEntries === 'function' ? auth.getDebugLogEntries() : [];
    renderLogs();
  }

  async function refreshDashboard() {
    await ensureToken();

    try {
      els.signoutButtons.forEach((button) => {
        button.hidden = false;
      });

      syncAdminNav();
      await loadLogs();
      setFeedback('', false);
      setView('dashboard');
    } catch (error) {
      if (error && error.status === 403) {
        els.forbiddenTitle.textContent = '无权访问';
        els.forbiddenMessage.textContent = '只有管理员可以访问调试日志页面。';
        setView('forbidden');
        return;
      }

      if (error && error.status === 401) {
        window.location.href = loginRouteWithTokenInvalid;
        return;
      }

      setView('dashboard');
      setFeedback(error.message || '加载调试日志失败。', true);
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
    state.logs = [];
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

  initDashboardSession()
    .then((ok) => {
      if (!ok) {
        return;
      }

      return refreshDashboard();
    })
    .catch((error) => {
      setView('forbidden');
      els.forbiddenTitle.textContent = '加载失败';
      els.forbiddenMessage.textContent = error && error.message ? error.message : '调试日志页面初始化失败。';
    });
})();
