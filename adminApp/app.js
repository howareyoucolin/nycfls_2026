let deferredPrompt = null;

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}

function initInstallPrompt() {
  const installButton = document.querySelector("[data-install-button]");
  const installHint = document.querySelector("[data-install-hint]");

  if (!installButton) {
    return;
  }

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event;
    installButton.classList.remove("is-hidden");
    if (installHint) {
      installHint.textContent = "This browser supports install. Tap the button to add the app to your device.";
    }
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

registerServiceWorker();
initInstallPrompt();
