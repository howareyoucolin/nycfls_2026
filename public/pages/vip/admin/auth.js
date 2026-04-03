(function () {
  const clerkScriptSrc = 'https://trusted-albacore-0.clerk.accounts.dev/npm/@clerk/clerk-js@5/dist/clerk.browser.js';
  const loginRoute = '/vip/admin/login';
  const debugEnabled = new URLSearchParams(window.location.search).get('debug') === '1';
  const debugStorageKey = 'vip-admin-debug-log';

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

  function ensureDebugPanel() {
    if (!debugEnabled || document.getElementById('vip-admin-debug-panel')) {
      return null;
    }

    const panel = document.createElement('pre');
    panel.id = 'vip-admin-debug-panel';
    panel.setAttribute('style', [
      'position:fixed',
      'left:8px',
      'right:8px',
      'bottom:8px',
      'max-height:38vh',
      'overflow:auto',
      'z-index:9999',
      'margin:0',
      'padding:10px',
      'border-radius:10px',
      'background:rgba(0,0,0,0.88)',
      'color:#9ef59e',
      'font:12px/1.4 monospace',
      'white-space:pre-wrap',
      'word-break:break-word',
    ].join(';'));

    panel.textContent = readDebugEntries().join('\n');
    document.body.appendChild(panel);
    return panel;
  }

  function debugLog(message) {
    const line = `${new Date().toISOString()} ${message}`;
    const entries = readDebugEntries();
    entries.push(line);
    writeDebugEntries(entries);

    if (!debugEnabled) {
      return;
    }

    const updatePanel = () => {
      const panel = ensureDebugPanel();
      if (panel) {
        panel.textContent = entries.slice(-80).join('\n');
      }
    };

    if (document.body) {
      updatePanel();
    } else {
      window.addEventListener('DOMContentLoaded', updatePanel, { once: true });
    }
  }

  function clearDebugLog() {
    try {
      window.sessionStorage.removeItem(debugStorageKey);
    } catch (error) {
      // Ignore storage failures.
    }
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

  function redirectToLogin(reason) {
    const nextUrl = buildLoginUrl(reason || 'need_login');
    debugLog(`redirectToLogin -> ${nextUrl}`);
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
        debugLog(`token claims azp=${payload.azp || '[none]'} iss=${payload.iss || '[none]'} sub=${payload.sub || '[none]'}`);
      }
    } catch (error) {
      debugLog('token claims decode failed');
    }

    debugLog('requireToken ok');
    return {
      clerk: result.clerk,
      token,
    };
  }

  async function signOut(publishableKey) {
    debugLog('signOut start');
    const clerk = await loadClerk(publishableKey);
    if (typeof clerk.signOut === 'function') {
      await clerk.signOut();
    }
    debugLog('signOut complete');
  }

  function setWhitelistDeniedView(titleEl, messageEl, options) {
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
    clearDebugLog,
    debugEnabled,
    debugLog,
    redirectToLogin,
    loadClerk,
    requireSession,
    requireToken,
    setWhitelistDeniedView,
    signOut,
  };
})();
