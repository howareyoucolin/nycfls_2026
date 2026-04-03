(function () {
  const app = document.querySelector('[data-vip-admin-vips]');

  if (!app) {
    return;
  }

  const state = {
    clerk: null,
    token: null,
    userEmail: '',
    viewerRole: '',
    items: [],
    counts: { all: 0, approved: 0, not_approved: 0, unread: 0, deleted: 0 },
    status: 'unread',
    page: 1,
    perPage: 50,
    totalItems: 0,
    totalPages: 1,
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
    searchForm: app.querySelector('[data-admin-search-form]'),
    search: app.querySelector('[data-admin-search]'),
    counts: app.querySelector('[data-admin-counts]'),
    list: app.querySelector('[data-signup-list]'),
    paginationTop: app.querySelector('[data-pagination-top]'),
    pagination: app.querySelector('[data-pagination]'),
    listFeedback: app.querySelector('[data-list-feedback]'),
    markAllReadButton: app.querySelector('[data-admin-mark-all-read]'),
    refreshButton: app.querySelector('[data-admin-refresh]'),
    retryButton: app.querySelector('[data-admin-retry]'),
    signoutButtons: Array.from(app.querySelectorAll('[data-admin-signout]')),
    usersLinks: Array.from(app.querySelectorAll('[data-admin-users-link]')),
    sessionEmail: app.querySelector('[data-admin-session-email]'),
  };

  const publishableKey = app.dataset.clerkPublishableKey || '';
  const loginRoute = '/vip/admin/login';
  const loginRouteWithTokenInvalid = `${loginRoute}?reason=token_invalid`;
  const mobileDrawerQuery = window.matchMedia('(max-width: 899px)');
  const initialParams = new URLSearchParams(window.location.search);
  const initialPage = Number(initialParams.get('page') || '1');
  const defaultStatus = 'unread';
  const auth = window.VipAdminAuth;

  if (Number.isFinite(initialPage) && initialPage > 0) {
    state.page = Math.floor(initialPage);
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

  function setListFeedback(message, isError) {
    els.listFeedback.textContent = message || '';
    els.listFeedback.style.color = isError ? '#ffc0b2' : '#6c5b4d';
  }

  function syncUsersNav() {
    if (!state.viewerRole) {
      return;
    }

    const isAdmin = state.viewerRole === 'admin';
    els.usersLinks.forEach((link) => {
      link.classList.toggle('is-hidden', !isAdmin);
    });
  }

  function syncSessionEmail() {
    if (!els.sessionEmail) {
      return;
    }

    els.sessionEmail.textContent = state.userEmail ? `logged in as ${state.userEmail}` : 'logged in as ...';
  }

  function syncBulkReadAction() {
    if (!els.markAllReadButton) {
      return;
    }

    const shouldShow = state.status === 'unread' && Number(state.counts.unread || 0) > 0;
    els.markAllReadButton.classList.toggle('is-hidden', !shouldShow);
    els.markAllReadButton.disabled = !shouldShow;
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

  function updateCounts() {
    const currentStatus = state.status || defaultStatus;
    const chips = [
      { value: 'all', label: '全部', count: state.counts.all || 0 },
      { value: 'approved', label: '已审核', count: state.counts.approved || 0 },
      { value: 'not_approved', label: '未审核', count: state.counts.not_approved || 0 },
      { value: 'unread', label: '未读', count: state.counts.unread || 0 },
      { value: 'deleted', label: '回收站', count: state.counts.deleted || 0 },
    ];

    els.counts.innerHTML = chips.map((chip) => `
      <button
        type="button"
        class="count-filter-chip ${chip.value === currentStatus ? 'is-active' : ''}"
        data-status-chip="${escapeHtml(chip.value)}"
        aria-pressed="${chip.value === currentStatus ? 'true' : 'false'}"
      >
        ${escapeHtml(chip.label)} ${chip.count}
      </button>
    `).join('');
  }

  function syncUrl() {
    const params = new URLSearchParams(window.location.search);
    const searchValue = els.search.value.trim();
    const statusValue = state.status || defaultStatus;

    if (searchValue) {
      params.set('search', searchValue);
    } else {
      params.delete('search');
    }

    if (statusValue && statusValue !== 'all') {
      params.set('status', statusValue);
    } else {
      params.delete('status');
    }

    if (state.page > 1) {
      params.set('page', String(state.page));
    } else {
      params.delete('page');
    }

    const query = params.toString();
    const nextUrl = query ? `${window.location.pathname}?${query}` : window.location.pathname;
    window.history.replaceState({}, '', nextUrl);
  }

  function renderPagination() {
    const paginationNodes = [els.paginationTop, els.pagination].filter(Boolean);

    if (!paginationNodes.length) {
      return;
    }

    if (state.totalItems <= 0) {
      paginationNodes.forEach((node) => {
        node.innerHTML = '';
        node.classList.add('is-hidden');
      });
      return;
    }

    paginationNodes.forEach((node) => {
      node.classList.remove('is-hidden');
    });

    const paginationItems = [];

    if (state.totalPages <= 7) {
      for (let pageNumber = 1; pageNumber <= state.totalPages; pageNumber += 1) {
        paginationItems.push(pageNumber);
      }
    } else {
      paginationItems.push(1);

      if (state.page > 3) {
        paginationItems.push('ellipsis-left');
      }

      const windowStart = Math.max(2, state.page - 1);
      const windowEnd = Math.min(state.totalPages - 1, state.page + 1);

      for (let pageNumber = windowStart; pageNumber <= windowEnd; pageNumber += 1) {
        paginationItems.push(pageNumber);
      }

      if (state.page < state.totalPages - 2) {
        paginationItems.push('ellipsis-right');
      }

      paginationItems.push(state.totalPages);
    }

    const markup = `
      <button
        type="button"
        class="page-arrow ${state.page <= 1 ? 'is-disabled' : ''}"
        data-page-target="${Math.max(1, state.page - 1)}"
        aria-label="上一页"
        ${state.page <= 1 ? 'disabled' : ''}
      >‹</button>
      <div class="page-numbers">
        ${paginationItems.map((item) => {
          if (typeof item !== 'number') {
            return '<span class="page-ellipsis">…</span>';
          }

          if (item === state.page) {
            return `<span class="page-number is-current">${item}</span>`;
          }

          return `
            <button
              type="button"
              class="page-number"
              data-page-target="${item}"
            >${item}</button>
          `;
        }).join('')}
      </div>
      <button
        type="button"
        class="page-arrow ${state.page >= state.totalPages ? 'is-disabled' : ''}"
        data-page-target="${Math.min(state.totalPages, state.page + 1)}"
        aria-label="下一页"
        ${state.page >= state.totalPages ? 'disabled' : ''}
      >›</button>
    `;

    paginationNodes.forEach((node) => {
      node.innerHTML = markup;
    });
  }

  function renderList() {
    if (!state.items.length) {
      els.list.innerHTML = `
        <div class="signup-empty-state">
          <div class="signup-empty-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 8h16v11H4z" />
              <path d="M9 8V6h6v2" />
              <path d="M4 11l4 3h8l4-3" />
            </svg>
          </div>
          <p class="signup-empty-title">当前筛选条件下没有数据。</p>
        </div>
      `;
      renderPagination();
      setListFeedback('', false);
      return;
    }

    setListFeedback('', false);
    els.list.innerHTML = state.items.map((item) => {
      const badges = [];
      if (Number(item.is_deleted) === 1) {
        badges.push({ className: 'is-deleted', label: '已删除' });
      } else {
        badges.push({
          className: Number(item.is_approved) === 1 ? 'is-approved' : 'is-pending',
          label: Number(item.is_approved) === 1 ? '已审核' : '未审核',
        });
        badges.push({
          className: Number(item.is_read) === 1 ? 'is-read' : 'is-unread',
          label: Number(item.is_read) === 1 ? '已读' : '未读',
        });
      }
      const meta = [item.generation ? `${item.generation}后` : '', item.location || ''].filter(Boolean).join(' · ');

      return `
        <a class="signup-item signup-item-link" href="/vip/admin/vip/${Number(item.id)}${Number(item.is_deleted) === 1 ? '?from=deleted' : ''}">
          <div class="signup-item-top">
            <div>
              <strong>${escapeHtml(item.nickname || `#${item.id}`)}</strong>
              <div>${escapeHtml(meta || '未填写')}</div>
            </div>
            <div class="signup-item-statuses">
              ${badges.map((badge) => `<span class="signup-item-status ${badge.className}">${escapeHtml(badge.label)}</span>`).join('')}
            </div>
          </div>
          <div class="signup-item-meta">
            <span>#${Number(item.id)}</span>
            <span>${escapeHtml(formatDateTime(item.created_at))}</span>
          </div>
        </a>
      `;
    }).join('');
    renderPagination();
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
      auth.debugLog(`vips fetch ${path}`);
      const response = await fetch(path, {
        ...options,
        headers,
      });

      const data = await response.json().catch(() => null);
      auth.debugLog(`vips fetch status ${path} -> ${response.status}`);

      if (!response.ok) {
        if (data && data.error && data.error.code) {
          auth.debugLog(`vips fetch error_code ${path} -> ${data.error.code}`);
        }
        if (data && data.data && Array.isArray(data.data.details)) {
          auth.debugLog(`vips fetch details ${data.data.details.join(' | ')}`);
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
      auth.debugLog('vips token cache hit');
      return;
    }

    auth.debugLog('vips ensureToken start');
    const authState = await auth.requireToken(publishableKey, 'need_login');
    if (!authState) {
      throw new Error('Unable to retrieve Clerk token.');
    }

    state.clerk = authState.clerk;
    state.token = authState.token;
    state.userEmail = authState.userEmail || '';
    syncSessionEmail();
  }

  async function fetchItems() {
    const query = new URLSearchParams({
      status: state.status || defaultStatus,
      search: els.search.value.trim(),
      page: String(state.page),
      per_page: String(state.perPage),
    });

    setListFeedback('正在加载报名数据...', false);

    const data = await apiFetch(`/api/vip-admin-list.php?${query.toString()}`, { method: 'GET' }, '正在获取报名数据...');
    state.items = Array.isArray(data.data && data.data.items) ? data.data.items : [];
    state.counts = data.data && data.data.counts ? data.data.counts : state.counts;
    state.viewerRole = String(data.data && data.data.viewer ? data.data.viewer.role || '' : '');
    state.page = Number(data.data && data.data.pagination ? data.data.pagination.page : state.page) || 1;
    state.perPage = Number(data.data && data.data.pagination ? data.data.pagination.per_page : state.perPage) || 50;
    state.totalItems = Number(data.data && data.data.pagination ? data.data.pagination.total_items : 0) || 0;
    state.totalPages = Number(data.data && data.data.pagination ? data.data.pagination.total_pages : 1) || 1;
    syncUrl();
    syncUsersNav();
    syncBulkReadAction();
    updateCounts();
    renderList();
  }

  async function refreshDashboard() {
    auth.debugLog('vips refreshDashboard start');
    await ensureToken();

    try {
      els.signoutButtons.forEach((button) => {
        button.hidden = false;
      });

      await fetchItems();
      setView('dashboard');
    } catch (error) {
      if (error && error.status === 403) {
        auth.debugLog('vips refreshDashboard forbidden');
        auth.redirectToAccessDenied('not_whitelisted');
        return;
      }

      if (error && error.status === 401) {
        auth.debugLog(`vips refreshDashboard redirect login -> ${loginRouteWithTokenInvalid}`);
        window.location.href = loginRouteWithTokenInvalid;
        return;
      }

      auth.debugLog(`vips refreshDashboard failed ${error.message || 'unknown'}`);
      setView('dashboard');
      setListFeedback(error.message || '加载报名数据失败。', true);
    }
  }

  async function initDashboardSession() {
    auth.debugLog('vips initDashboardSession start');
    const sessionState = await auth.requireSession(publishableKey, 'need_login');
    if (!sessionState) {
      return false;
    }

    auth.debugLog('vips initDashboardSession ok');
    state.clerk = sessionState.clerk;
    return true;
  }

  async function signOut() {
    await auth.signOut(publishableKey);
    state.token = null;
    state.items = [];
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

  els.refreshButton.addEventListener('click', () => {
    refreshDashboard().catch((error) => {
      setListFeedback(error.message || '刷新失败。', true);
    });
  });

  if (els.markAllReadButton) {
    els.markAllReadButton.addEventListener('click', async () => {
      els.markAllReadButton.disabled = true;
      setListFeedback('正在将全部未读标记为已读...', false);

      try {
        await ensureToken();
        await apiFetch('/api/vip-admin-mark-all-read.php', {
          method: 'POST',
          body: JSON.stringify({}),
        }, '正在批量标记为已读...');
        await fetchItems();
        setListFeedback('全部未读已标记为已读。', false);
      } catch (error) {
        setListFeedback(error.message || '批量标记失败。', true);
      } finally {
        syncBulkReadAction();
      }
    });
  }

  els.retryButton.addEventListener('click', () => {
    refreshDashboard().catch((error) => {
      if (error && error.status === 403) {
        auth.redirectToAccessDenied('not_whitelisted');
        return;
      }
      if (els.forbiddenTitle) {
        els.forbiddenTitle.textContent = 'Something went wrong';
      }
      els.forbiddenMessage.textContent = error.message || '重新验证失败。';
    });
  });

  els.signoutButtons.forEach((button) => {
    button.addEventListener('click', () => {
      signOut().catch(() => {
        setListFeedback('退出时发生异常，请刷新页面重试。', true);
      });
    });
  });

  if (els.searchForm) {
    els.searchForm.addEventListener('submit', (event) => {
      event.preventDefault();
      state.page = 1;
      refreshDashboard().catch((error) => {
        setListFeedback(error.message || '搜索失败。', true);
      });
    });
  }

  [els.paginationTop, els.pagination].filter(Boolean).forEach((paginationNode) => {
    paginationNode.addEventListener('click', (event) => {
      const button = event.target.closest('[data-page-target]');
      if (!button) {
        return;
      }

      const targetPage = Number(button.getAttribute('data-page-target') || '0');
      if (!Number.isFinite(targetPage) || targetPage <= 0 || targetPage === state.page) {
        return;
      }

      state.page = targetPage;

      refreshDashboard().catch((error) => {
        setListFeedback(error.message || '翻页失败。', true);
      });
    });
  });

  if (initialParams.has('search')) {
    els.search.value = initialParams.get('search') || '';
  }

  if (initialParams.has('status')) {
    const initialStatus = initialParams.get('status') || defaultStatus;
    if (['all', 'approved', 'not_approved', 'unread', 'deleted'].includes(initialStatus)) {
      state.status = initialStatus;
    }
  } else {
    state.status = defaultStatus;
  }

  els.counts.addEventListener('click', (event) => {
    const button = event.target.closest('[data-status-chip]');
    if (!button) {
      return;
    }

    const nextStatus = button.getAttribute('data-status-chip') || defaultStatus;
    if (state.status === nextStatus) {
      return;
    }

    state.status = nextStatus;
    state.page = 1;
    updateCounts();
    refreshDashboard().catch((error) => {
      setListFeedback(error.message || '筛选失败。', true);
    });
  });

  updateCounts();
  syncBulkReadAction();
  setView('dashboard');

  initDashboardSession()
    .then((isReady) => {
      if (!isReady) {
        return;
      }

      return refreshDashboard();
    })
    .catch((error) => {
      auth.debugLog(`vips init failed ${error && error.message ? error.message : 'unknown'}`);
      setView('forbidden');
      els.forbiddenMessage.textContent = error.message || 'Clerk 初始化失败。';
    });
})();
