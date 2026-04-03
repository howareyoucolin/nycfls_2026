(function () {
  const clerkScriptSrc = 'https://trusted-albacore-0.clerk.accounts.dev/npm/@clerk/clerk-js@5/dist/clerk.browser.js';
  const loginRoute = '/vip/admin/login';

  function buildLoginUrl(reason) {
    if (!reason) {
      return loginRoute;
    }

    return `${loginRoute}?reason=${encodeURIComponent(reason)}`;
  }

  function redirectToLogin(reason) {
    window.location.href = buildLoginUrl(reason || 'auth_failed');
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
      throw new Error('缺少 Clerk publishable key，请先直接在代码里补上。');
    }

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

    return window.Clerk;
  }

  async function requireSession(publishableKey, reason) {
    const clerk = await loadClerk(publishableKey);
    const session = clerk.session;

    if (!session || typeof session.getToken !== 'function') {
      redirectToLogin(reason || 'auth_failed');
      return null;
    }

    return { clerk, session };
  }

  async function requireToken(publishableKey, reason) {
    const result = await requireSession(publishableKey, reason);
    if (!result) {
      return null;
    }

    const token = await result.session.getToken();
    if (!token) {
      redirectToLogin(reason || 'auth_failed');
      return null;
    }

    return {
      clerk: result.clerk,
      token,
    };
  }

  async function signOut(publishableKey) {
    const clerk = await loadClerk(publishableKey);
    if (typeof clerk.signOut === 'function') {
      await clerk.signOut();
    }
  }

  window.VipAdminAuth = {
    buildLoginUrl,
    redirectToLogin,
    loadClerk,
    requireSession,
    requireToken,
    signOut,
  };
})();
