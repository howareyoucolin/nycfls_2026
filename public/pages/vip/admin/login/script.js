(function () {
  const app = document.querySelector('[data-vip-admin-login]');

  if (!app) {
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
    setLoginFeedback('正在加载 Clerk 登录组件...');
    const clerk = await auth.loadClerk(publishableKey);

    if (clerk.session) {
      if (redirectReason === 'auth_failed') {
        setLoginFeedback('检测到已登录，但后台校验没有通过，请重新登录后再试。');
      } else {
        setLoginFeedback('已检测到登录状态，正在进入后台...');
        window.location.href = dashboardUrl;
        return;
      }
    }

    if (redirectReason === 'auth_failed') {
      try {
        await auth.signOut(publishableKey);
      } catch (error) {
        // Keep the sign-in form available even if the stale session cannot be cleared.
      }

      if (window.history && typeof window.history.replaceState === 'function') {
        window.history.replaceState({}, '', window.location.pathname);
      }
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
