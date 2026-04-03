(function () {
  const app = document.querySelector('[data-vip-admin-login]');

  if (!app) {
    return;
  }

  const publishableKey = app.dataset.clerkPublishableKey || '';
  const loginFeedback = app.querySelector('[data-login-feedback]');
  const signInRoot = document.getElementById('clerk-signin');
  const dashboardRoute = '/vip/admin';
  const clerkScriptSrc = 'https://trusted-albacore-0.clerk.accounts.dev/npm/@clerk/clerk-js@5/dist/clerk.browser.js';
  const pageParams = new URLSearchParams(window.location.search);
  const redirectReason = pageParams.get('reason') || '';

  function setLoginFeedback(message) {
    loginFeedback.textContent = message;
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

  async function mountLogin() {
    if (!publishableKey) {
      setLoginFeedback('缺少 Clerk publishable key，请先直接在代码里补上。');
      return;
    }

    setLoginFeedback('正在加载 Clerk 登录组件...');

    await loadScript(clerkScriptSrc, {
      'data-clerk-publishable-key': publishableKey,
    });

    if (!window.Clerk) {
      throw new Error('Clerk script is unavailable.');
    }

    await window.Clerk.load({
      publishableKey,
    });

    if (window.Clerk.session) {
      if (redirectReason === 'auth_failed') {
        setLoginFeedback('检测到已登录，但后台校验没有通过，请重新登录后再试。');
      } else {
        setLoginFeedback('已检测到登录状态，正在进入后台...');
        window.location.href = dashboardRoute;
        return;
      }
    }

    if (redirectReason === 'auth_failed') {
      try {
        if (typeof window.Clerk.signOut === 'function') {
          await window.Clerk.signOut();
        }
      } catch (error) {
        // Keep the sign-in form available even if the stale session cannot be cleared.
      }

      if (window.history && typeof window.history.replaceState === 'function') {
        window.history.replaceState({}, '', window.location.pathname);
      }
    }

    if (typeof window.Clerk.mountSignIn !== 'function') {
      throw new Error('Clerk SignIn component is unavailable.');
    }

    window.Clerk.mountSignIn(signInRoot, {
      appearance: {
        elements: {
          footerAction: { display: 'none' },
        },
      },
      afterSignInUrl: dashboardRoute,
      afterSignUpUrl: dashboardRoute,
    });

    if (redirectReason === 'auth_failed') {
      setLoginFeedback('请重新登录管理员账号。');
      return;
    }

    setLoginFeedback('请使用 Clerk 账号登录。');
  }

  mountLogin().catch((error) => {
    setLoginFeedback(error.message || 'Clerk 登录组件加载失败。');
  });
})();
