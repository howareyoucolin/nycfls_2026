(function () {
  const app = document.querySelector('[data-vip-admin-login]');

  if (!app) {
    return;
  }

  if (window.location.hostname === 'nycflushing.com') {
    const canonicalUrl = new URL(window.location.href);
    canonicalUrl.hostname = 'www.nycflushing.com';
    window.location.replace(canonicalUrl.toString());
    return;
  }

  const publishableKey = app.dataset.clerkPublishableKey || '';
  const loginFeedback = app.querySelector('[data-login-feedback]');
  const signInRoot = document.getElementById('clerk-signin');
  const dashboardRoute = '/vip/admin/vips/';
  const dashboardUrl = new URL(dashboardRoute, window.location.origin).toString();
  const pageParams = new URLSearchParams(window.location.search);
  const redirectReason = pageParams.get('reason') || '';
  const auth = window.VipAdminAuth;

  function setLoginFeedback(message) {
    loginFeedback.textContent = message;
  }

  async function mountLogin() {
    auth.debugLog(`login mount redirectReason=${redirectReason || 'none'}`);
    setLoginFeedback('正在加载 Clerk 登录组件...');
    let clerk = await auth.loadClerk(publishableKey);

    // Legacy / soft "auth_failed" (e.g. not on whitelist): keep Clerk signed in and let the admin UI show access denied.
    if (clerk.session && redirectReason === 'auth_failed') {
      auth.debugLog('login auth_failed -> dashboard (no signOut)');
      setLoginFeedback('正在进入后台...');
      window.location.href = dashboardUrl;
      return;
    }

    if (redirectReason === 'token_invalid') {
      auth.debugLog('login token_invalid branch');
      if (clerk.session) {
        try {
          await auth.signOut(publishableKey);
        } catch (error) {
          auth.debugLog(`login signOut failed ${error && error.message ? error.message : 'unknown'}`);
        }
      }

      if (window.history && typeof window.history.replaceState === 'function') {
        window.history.replaceState({}, '', window.location.pathname);
      }

      clerk = await auth.loadClerk(publishableKey);
      setLoginFeedback('登录状态已失效，请重新登录管理员账号。');
    }

    if (clerk.session) {
      auth.debugLog('login found existing session -> dashboard');
      setLoginFeedback('已检测到登录状态，正在进入后台...');
      auth.debugLog(`login redirect -> ${dashboardUrl}`);
      window.location.href = dashboardUrl;
      return;
    }

    if (typeof clerk.mountSignIn !== 'function') {
      throw new Error('Clerk SignIn component is unavailable.');
    }

    clerk.mountSignIn(signInRoot, {
      appearance: {
        elements: {
          footerAction: { display: 'none' },
        },
      },
      forceRedirectUrl: dashboardUrl,
      fallbackRedirectUrl: dashboardUrl,
      signInForceRedirectUrl: dashboardUrl,
      signInFallbackRedirectUrl: dashboardUrl,
      signUpForceRedirectUrl: dashboardUrl,
      signUpFallbackRedirectUrl: dashboardUrl,
      afterSignInUrl: dashboardUrl,
      afterSignUpUrl: dashboardUrl,
    });

    if (redirectReason === 'token_invalid') {
      auth.debugLog('login sign-in mounted after token_invalid');
      return;
    }

    auth.debugLog('login sign-in mounted');
    setLoginFeedback('请使用 Clerk 账号登录。');
  }

  mountLogin().catch((error) => {
    auth.debugLog(`login mount failed ${error && error.message ? error.message : 'unknown'}`);
    setLoginFeedback(error.message || 'Clerk 登录组件加载失败。');
  });
})();
