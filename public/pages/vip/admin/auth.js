(function () {
  const clerkScriptSrc = 'https://trusted-albacore-0.clerk.accounts.dev/npm/@clerk/clerk-js@5/dist/clerk.browser.js';
  const accessDeniedRoute = '/vip/admin/access-denied/';
  const loginRoute = '/vip/admin/login';
  const debugEnabled = new URLSearchParams(window.location.search).get('debug') === '1';
  const debugStorageKey = 'vip-admin-debug-log';
  const debugState = {
    lastTokenClaims: null,
  };

  function readDebugEntries() {
    try {
      const raw = window.sessionStorage.getItem(debugStorageKey);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  function writeDebugEntries(entries) {
    try {
      window.sessionStorage.setItem(debugStorageKey, JSON.stringify(entries.slice(-80)));
    } catch (error) {
      // Ignore storage failures in private/incognito or restricted modes.
    }
  }

  function cloneDebugValue(value, depth, seen) {
    if (value == null) {
      return value;
    }

    if (typeof value === 'string') {
      return value.length > 400 ? `${value.slice(0, 400)}... [truncated ${value.length - 400} chars]` : value;
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'function') {
      return `[function ${value.name || 'anonymous'}]`;
    }

    if (value instanceof Date) {
      return value.toISOString();
    }

    if (depth <= 0) {
      if (Array.isArray(value)) {
        return `[array(${value.length})]`;
      }

      return '[object]';
    }

    if (typeof value !== 'object') {
      return String(value);
    }

    if (seen.has(value)) {
      return '[circular]';
    }

    seen.add(value);

    if (Array.isArray(value)) {
      return value.slice(0, 20).map((item) => cloneDebugValue(item, depth - 1, seen));
    }

    const output = {};
    Object.keys(value).slice(0, 40).forEach((key) => {
      try {
        output[key] = cloneDebugValue(value[key], depth - 1, seen);
      } catch (error) {
        output[key] = `[unavailable: ${error && error.message ? error.message : 'unknown'}]`;
      }
    });
    return output;
  }

  function collectClerkDebugData() {
    const clerk = window.Clerk || null;
    const session = clerk && clerk.session ? clerk.session : null;
    const user =
      (clerk && clerk.user) ||
      (session && session.user) ||
      null;
    const client = clerk && clerk.client ? clerk.client : null;
    const organization = clerk && clerk.organization ? clerk.organization : null;

    return {
      page: window.location.href,
      loadedAt: new Date().toISOString(),
      clerkLoaded: Boolean(clerk),
      sessionExists: Boolean(session),
      userExists: Boolean(user),
      organizationExists: Boolean(organization),
      clerk: cloneDebugValue(clerk ? {
        version: clerk.version,
        publishableKey: clerk.publishableKey,
        domain: clerk.domain,
        isSignedIn: clerk.isSignedIn,
      } : null, 2, new WeakSet()),
      session: cloneDebugValue(session, 3, new WeakSet()),
      user: cloneDebugValue(user, 4, new WeakSet()),
      client: cloneDebugValue(client, 3, new WeakSet()),
      organization: cloneDebugValue(organization, 3, new WeakSet()),
      lastTokenClaims: cloneDebugValue(debugState.lastTokenClaims, 3, new WeakSet()),
    };
  }

  function updateDebugPanels() {
    return collectClerkDebugData();
  }

  function debugLog(message) {
    const line = `${new Date().toISOString()} ${message}`;
    const entries = readDebugEntries();
    entries.push(line);
    writeDebugEntries(entries);

    if (!debugEnabled) {
      return;
    }

    updateDebugPanels();
  }

  function clearDebugLog() {
    try {
      window.sessionStorage.removeItem(debugStorageKey);
    } catch (error) {
      // Ignore storage failures.
    }
  }

  function getDebugLogEntries() {
    return readDebugEntries().slice().reverse();
  }

  if (debugEnabled) {
    debugLog(`page ${window.location.href}`);
  }

  function buildLoginUrl(reason) {
    if (!reason) {
      return loginRoute;
    }

    return `${loginRoute}?reason=${encodeURIComponent(reason)}`;
  }

  function buildAccessDeniedUrl(reason) {
    const params = new URLSearchParams();
    if (reason) {
      params.set('reason', reason);
    }
    if (debugEnabled) {
      params.set('debug', '1');
    }

    const query = params.toString();
    return query ? `${accessDeniedRoute}?${query}` : accessDeniedRoute;
  }

  function redirectToLogin(reason) {
    const nextUrl = buildLoginUrl(reason || 'need_login');
    debugLog(`redirectToLogin -> ${nextUrl}`);
    window.location.href = nextUrl;
  }

  function redirectToAccessDenied(reason) {
    const nextUrl = buildAccessDeniedUrl(reason || 'not_whitelisted');
    debugLog(`redirectToAccessDenied -> ${nextUrl}`);
    window.location.href = nextUrl;
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

  async function loadClerk(publishableKey) {
    if (!publishableKey) {
      debugLog('loadClerk missing publishable key');
      throw new Error('缺少 Clerk publishable key，请先直接在代码里补上。');
    }

    debugLog(`loadClerk start origin=${window.location.origin}`);
    await loadScript(clerkScriptSrc, {
      'data-clerk-publishable-key': publishableKey,
    });

    if (!window.Clerk) {
      throw new Error('Clerk script is unavailable.');
    }

    if (typeof window.Clerk.load === 'function') {
      await window.Clerk.load({
        publishableKey,
      });
    }

    debugLog(`loadClerk complete session=${window.Clerk.session ? 'yes' : 'no'}`);
    updateDebugPanels();

    return window.Clerk;
  }

  async function requireSession(publishableKey, reason) {
    const clerk = await loadClerk(publishableKey);
    const session = clerk.session;

    if (!session || typeof session.getToken !== 'function') {
      debugLog('requireSession missing session');
      redirectToLogin(reason || 'need_login');
      return null;
    }

    debugLog('requireSession ok');
    return { clerk, session };
  }

  async function requireToken(publishableKey, reason) {
    const result = await requireSession(publishableKey, reason);
    if (!result) {
      return null;
    }

    const token = await result.session.getToken();
    if (!token) {
      debugLog('requireToken missing token');
      redirectToLogin('token_invalid');
      return null;
    }

    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
        debugState.lastTokenClaims = payload;
        debugLog(`token claims azp=${payload.azp || '[none]'} iss=${payload.iss || '[none]'} sub=${payload.sub || '[none]'}`);
      }
    } catch (error) {
      debugLog('token claims decode failed');
    }

    debugLog('requireToken ok');
    return {
      clerk: result.clerk,
      token,
      userEmail: getClerkUserEmail(result.clerk),
    };
  }

  function getClerkUserEmail(clerk) {
    const candidates = [
      clerk && clerk.user ? clerk.user : null,
      clerk && clerk.session && clerk.session.user ? clerk.session.user : null,
    ];

    for (const user of candidates) {
      if (!user) {
        continue;
      }

      const primary = user.primaryEmailAddress && user.primaryEmailAddress.emailAddress
        ? String(user.primaryEmailAddress.emailAddress).trim()
        : '';
      if (primary) {
        return primary.toLowerCase();
      }

      if (Array.isArray(user.emailAddresses)) {
        for (const emailEntry of user.emailAddresses) {
          const value = emailEntry && emailEntry.emailAddress ? String(emailEntry.emailAddress).trim() : '';
          if (value) {
            return value.toLowerCase();
          }
        }
      }
    }

    return '';
  }

  async function signOut(publishableKey) {
    debugLog('signOut start');
    const clerk = await loadClerk(publishableKey);
    if (typeof clerk.signOut === 'function') {
      await clerk.signOut();
    }
    debugState.lastTokenClaims = null;
    debugLog('signOut complete');
    updateDebugPanels();
  }

  function setAccessDeniedView(titleEl, messageEl, options) {
    const title = 'Access denied';
    const message = 'Your account does not have access to this page. If you need access, contact an administrator.';
    if (titleEl) {
      titleEl.textContent = title;
    }
    if (messageEl) {
      messageEl.textContent = message;
    }
    if (options && options.setDocumentTitle) {
      document.title = `${title} · VIP Admin`;
    }
  }

  window.VipAdminAuth = {
    buildLoginUrl,
    buildAccessDeniedUrl,
    clearDebugLog,
    debugEnabled,
    debugLog,
    getDebugLogEntries,
    getClerkUserEmail,
    redirectToAccessDenied,
    redirectToLogin,
    loadClerk,
    requireSession,
    requireToken,
    setAccessDeniedView,
    signOut,
  };
})();
