(function () {
  const app = document.querySelector('[data-vip-admin-access-denied]');

  if (!app) {
    return;
  }

  const publishableKey = app.dataset.clerkPublishableKey || '';
  const auth = window.VipAdminAuth;
  const messageEl = app.querySelector('[data-access-denied-message]');
  const signoutButton = app.querySelector('[data-admin-signout]');

  if (messageEl) {
    const params = new URLSearchParams(window.location.search);
    const reason = params.get('reason') || 'not_whitelisted';
    if (reason === 'not_whitelisted') {
      messageEl.textContent = 'Your account is not in the VIP admin whitelist.';
    }
  }

  if (signoutButton) {
    signoutButton.addEventListener('click', () => {
      auth.signOut(publishableKey)
        .catch(() => null)
        .finally(() => {
          window.location.href = '/vip/admin/login';
        });
    });
  }
})();
