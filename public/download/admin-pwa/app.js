let deferredPrompt = null;
const publishableKey = "pk_test_dHJ1c3RlZC1hbGJhY29yZS0wLmNsZXJrLmFjY291bnRzLmRldiQ";
const pollIntervalMs = 5 * 60 * 1000;
let pollTimer = null;

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}

function initInstallPrompt() {
  const installButton = document.querySelector("[data-install-button]");

  if (!installButton) {
    return;
  }

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event;
    installButton.classList.remove("is-hidden");
  });

  installButton.addEventListener("click", async () => {
    if (!deferredPrompt) {
      return;
    }

    deferredPrompt.prompt();
    await deferredPrompt.userChoice.catch(() => null);
    deferredPrompt = null;
    installButton.classList.add("is-hidden");
  });
}

async function setAppBadgeCount(count) {
  try {
    if (typeof navigator.clearAppBadge === "function" && Number(count) <= 0) {
      await navigator.clearAppBadge();
      return;
    }

    if (typeof navigator.setAppBadge === "function") {
      await navigator.setAppBadge(Number(count));
    }
  } catch (error) {
    // Ignore unsupported badge APIs or platform failures.
  }
}

async function loadUnreadCount() {
  const countEl = document.querySelector("[data-unread-count]");
  const noteEl = document.querySelector("[data-status-note]");
  const auth = window.VipAdminAuth;

  if (!countEl || !noteEl || !auth) {
    return;
  }

  noteEl.textContent = "正在同步未读报名数...";

  try {
    const authState = await auth.requireToken(publishableKey, "need_login");
    if (!authState || !authState.token) {
      return;
    }

    const headers = new Headers();
    headers.set("Authorization", `Bearer ${authState.token}`);
    headers.set("X-Clerk-Token", authState.token);
    headers.set("X-Clerk-User-Email", authState.userEmail || "");

    const response = await fetch("/api/vip-admin-unread-count.php", {
      method: "GET",
      cache: "no-store",
      headers,
    });

    const data = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(data && data.error && data.error.message ? data.error.message : "未读数加载失败。");
    }

    const count = Number(data && data.data ? data.data.unread_count || 0 : 0);
    countEl.textContent = String(count);
    noteEl.textContent = count > 0 ? `当前有 ${count} 条未读报名。` : "当前没有未读报名。";
    document.title = count > 0 ? `(${count}) VIP Admin` : "VIP Admin";
    await setAppBadgeCount(count);
  } catch (error) {
    countEl.textContent = "--";
    noteEl.textContent = error && error.message ? error.message : "未读数加载失败。";
  }
}

function startUnreadPolling() {
  if (pollTimer) {
    window.clearInterval(pollTimer);
  }

  loadUnreadCount();
  pollTimer = window.setInterval(() => {
    if (document.visibilityState === "visible") {
      loadUnreadCount();
    }
  }, pollIntervalMs);
}

registerServiceWorker();
initInstallPrompt();
window.addEventListener("load", startUnreadPolling);
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    loadUnreadCount();
  }
});
