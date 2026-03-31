(function () {
  const app = document.querySelector('[data-vip-admin-vips]');

  if (!app) {
    return;
  }

  const state = {
    clerk: null,
    token: null,
    items: [],
    counts: { all: 0, pending: 0, approved: 0 },
    status: 'pending',
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
    forbiddenMessage: app.querySelector('[data-forbidden-message]'),
    search: app.querySelector('[data-admin-search]'),
    counts: app.querySelector('[data-admin-counts]'),
    list: app.querySelector('[data-signup-list]'),
    paginationTop: app.querySelector('[data-pagination-top]'),
    pagination: app.querySelector('[data-pagination]'),
    listFeedback: app.querySelector('[data-list-feedback]'),
    refreshButton: app.querySelector('[data-admin-refresh]'),
    retryButton: app.querySelector('[data-admin-retry]'),
    signoutButtons: Array.from(app.querySelectorAll('[data-admin-signout]')),
  };

  const publishableKey = app.dataset.clerkPublishableKey || '';
  const clerkScriptSrc = 'https://trusted-albacore-0.clerk.accounts.dev/npm/@clerk/clerk-js@5/dist/clerk.browser.js';
  const loginRoute = '/vip/admin/login';
  const mobileDrawerQuery = window.matchMedia('(max-width: 899px)');
  const initialParams = new URLSearchParams(window.location.search);
  const initialPage = Number(initialParams.get('page') || '1');
  const defaultStatus = 'pending';

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
      { value: 'pending', label: '待审核', count: state.counts.pending || 0 },
      { value: 'approved', label: '已审核', count: state.counts.approved || 0 },
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
      });
      return;
    }

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
      els.list.innerHTML = '';
      renderPagination();
      setListFeedback('当前筛选条件下没有数据。', false);
      return;
    }

    setListFeedback('', false);
    els.list.innerHTML = state.items.map((item) => {
      const statusClass = Number(item.is_approved) === 1 ? 'is-approved' : 'is-pending';
      const statusLabel = Number(item.is_approved) === 1 ? '已审核' : '待审核';
      const meta = [item.generation ? `${item.generation}后` : '', item.location || ''].filter(Boolean).join(' · ');

      return `
        <a class="signup-item signup-item-link" href="/vip/admin/vip/${Number(item.id)}">
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
        </a>
      `;
    }).join('');
    renderPagination();
  }

  async function apiFetch(path, options, reason) {
    startLoading(reason);
    const headers = new Headers(options && options.headers ? options.headers : {});
    headers.set('Authorization', `Bearer ${state.token}`);

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

  async function checkWhitelist() {
    const data = await apiFetch('/api/vip-admin-whitelist.php', { method: 'GET' }, '正在验证管理员权限...');
    return data && data.data ? data.data : {};
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
    state.page = Number(data.data && data.data.pagination ? data.data.pagination.page : state.page) || 1;
    state.perPage = Number(data.data && data.data.pagination ? data.data.pagination.per_page : state.perPage) || 50;
    state.totalItems = Number(data.data && data.data.pagination ? data.data.pagination.total_items : 0) || 0;
    state.totalPages = Number(data.data && data.data.pagination ? data.data.pagination.total_pages : 1) || 1;
    syncUrl();
    updateCounts();
    renderList();
  }

  async function refreshDashboard() {
    await ensureToken();

    try {
      await checkWhitelist();
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
      state.page = 1;
      refreshDashboard().catch((error) => {
        setListFeedback(error.message || '搜索失败。', true);
      });
    }, 250);
  });

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
    if (['all', 'pending', 'approved'].includes(initialStatus)) {
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
