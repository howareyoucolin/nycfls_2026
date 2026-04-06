(function () {
  const app = document.querySelector('[data-vip-admin-token-status]');

  if (!app) {
    return;
  }

  const state = {
    clerk: null,
    token: null,
    claims: null,
    userEmail: '',
    sessionStatus: 'session status checking...',
    pendingRequests: 0,
    tickerId: 0,
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
    refreshButton: app.querySelector('[data-admin-token-refresh]'),
    signoutButtons: Array.from(app.querySelectorAll('[data-admin-signout]')).filter(Boolean),
    sessionEmail: app.querySelector('[data-admin-session-email]'),
    sessionStatus: app.querySelector('[data-admin-session-status]'),
    feedback: app.querySelector('[data-token-feedback]'),
    statusValue: app.querySelector('[data-token-session-status]'),
    nowValue: app.querySelector('[data-token-now]'),
    issuedAtValue: app.querySelector('[data-token-issued-at]'),
    expiresAtValue: app.querySelector('[data-token-expires-at]'),
    remainingValue: app.querySelector('[data-token-remaining]'),
    lifetimeValue: app.querySelector('[data-token-lifetime]'),
    previewValue: app.querySelector('[data-token-preview]'),
    claimsValue: app.querySelector('[data-token-claims]'),
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

  function formatDateTime(seconds) {
    const numeric = Number(seconds || 0);
    if (!Number.isFinite(numeric) || numeric <= 0) {
      return '--';
    }

    const date = new Date(numeric * 1000);
    if (Number.isNaN(date.getTime())) {
      return '--';
    }

    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  function formatDuration(seconds) {
    const numeric = Math.max(0, Number(seconds || 0));
    if (!Number.isFinite(numeric)) {
      return '--';
    }

    const minutes = Math.floor(numeric / 60);
    const remainder = Math.floor(numeric % 60);
    return `${minutes}m ${remainder}s`;
  }

  function syncSessionEmail() {
    if (els.sessionEmail) {
      els.sessionEmail.textContent = state.userEmail ? `logged in as ${state.userEmail}` : 'logged in as ...';
    }

    if (els.sessionStatus) {
      els.sessionStatus.textContent = state.sessionStatus || 'session status checking...';
    }
  }

  function renderTokenDetails() {
    const claims = state.claims || {};
    const nowSeconds = Math.floor(Date.now() / 1000);
    const issuedAt = Number(claims.iat || 0);
    const expiresAt = Number(claims.exp || 0);
    const remainingSeconds = expiresAt > 0 ? Math.max(0, expiresAt - nowSeconds) : 0;
    const lifetimeSeconds = issuedAt > 0 && expiresAt > 0 ? Math.max(0, expiresAt - issuedAt) : 0;

    if (els.statusValue) {
      els.statusValue.textContent = state.sessionStatus || '--';
    }
    if (els.nowValue) {
      els.nowValue.textContent = new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
      });
    }
    if (els.issuedAtValue) {
      els.issuedAtValue.textContent = formatDateTime(issuedAt);
    }
    if (els.expiresAtValue) {
      els.expiresAtValue.textContent = formatDateTime(expiresAt);
    }
    if (els.remainingValue) {
      els.remainingValue.textContent = expiresAt > 0 ? formatDuration(remainingSeconds) : '--';
    }
    if (els.lifetimeValue) {
      els.lifetimeValue.textContent = lifetimeSeconds > 0 ? formatDuration(lifetimeSeconds) : '--';
    }
    if (els.previewValue) {
      if (!state.token) {
        els.previewValue.textContent = '--';
      } else if (state.token.length <= 72) {
        els.previewValue.textContent = state.token;
      } else {
        els.previewValue.textContent = `${state.token.slice(0, 36)}...${state.token.slice(-24)}`;
      }
    }
    if (els.claimsValue) {
      els.claimsValue.textContent = state.claims ? JSON.stringify(state.claims, null, 2) : '--';
    }
  }

  function startTicker() {
    if (state.tickerId) {
      window.clearInterval(state.tickerId);
    }

    state.tickerId = window.setInterval(() => {
      renderTokenDetails();
    }, 1000);
  }

  async function verifyAccess() {
    const response = await fetch('/api/vip-admin-list.php?status=all&page=1&per_page=1', {
      method: 'GET',
      cache: 'no-store',
      headers: {
        Authorization: `Bearer ${state.token}`,
        'X-Clerk-Token': state.token,
        'X-Clerk-User-Email': state.userEmail,
      },
    });

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      const error = new Error(data && data.error && data.error.message ? data.error.message : '请求失败。');
      error.status = response.status;
      throw error;
    }
  }

  async function refreshTokenDetails() {
    startLoading('正在读取 token 状态...');

    try {
      const authState = await auth.requireToken(publishableKey, 'need_login');
      if (!authState) {
        throw new Error('无法获取 Clerk 登录令牌。');
      }

      state.clerk = authState.clerk;
      state.token = authState.token;
      state.claims = typeof auth.decodeJwtPayload === 'function' ? auth.decodeJwtPayload(authState.token) : null;
      state.userEmail = authState.userEmail || '';
      state.sessionStatus = typeof auth.describeSessionToken === 'function'
        ? auth.describeSessionToken(authState.token)
        : 'session active';

      syncSessionEmail();
      renderTokenDetails();
      await verifyAccess();
      setFeedback('已读取最新 token 状态。', false);
      setView('dashboard');
    } finally {
      stopLoading();
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
    state.claims = null;
    window.clearInterval(state.tickerId);
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
      refreshTokenDetails().catch((error) => {
        els.forbiddenMessage.textContent = error.message || '重新验证失败。';
      });
    });
  }

  if (els.refreshButton) {
    els.refreshButton.addEventListener('click', () => {
      refreshTokenDetails().catch((error) => {
        setFeedback(error && error.message ? error.message : '刷新 token 状态失败。', true);
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

      els.signoutButtons.forEach((button) => {
        button.hidden = false;
      });
      startTicker();
      return refreshTokenDetails();
    })
    .catch((error) => {
      if (error && error.status === 403) {
        setView('forbidden');
        els.forbiddenTitle.textContent = '无权访问';
        els.forbiddenMessage.textContent = '你的账号无法访问 token 状态页面。';
        return;
      }

      if (error && error.status === 401) {
        window.location.href = loginRouteWithTokenInvalid;
        return;
      }

      setView('forbidden');
      els.forbiddenTitle.textContent = '加载失败';
      els.forbiddenMessage.textContent = error && error.message ? error.message : 'token 状态页面初始化失败。';
    });
})();
