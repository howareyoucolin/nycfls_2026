(function () {
  const nav = document.querySelector('[data-vip-nav]');
  const signupLink = document.querySelector('[data-vip-signup-link]');

  if (!nav || !signupLink) {
    return;
  }

  const pathname = window.location.pathname || '/vip';
  const searchParams = new URLSearchParams(window.location.search);
  const fingerprintStorageKey = 'vip-signup-device-fingerprint-v1';
  const existingProfileStorageKey = 'vip-signup-existing-profile-v1';

  function readExistingProfileFlag() {
    try {
      return window.sessionStorage.getItem(existingProfileStorageKey) === '1';
    } catch (error) {
      return false;
    }
  }

  function writeExistingProfileFlag(value) {
    try {
      if (value) {
        window.sessionStorage.setItem(existingProfileStorageKey, '1');
      } else {
        window.sessionStorage.removeItem(existingProfileStorageKey);
      }
    } catch (error) {
      // Ignore storage failures.
    }
  }

  function syncSignupLink(hasExistingProfile) {
    const shouldShowEdit = pathname.startsWith('/vip/edit') || hasExistingProfile;
    signupLink.textContent = shouldShowEdit ? '编辑我的资料' : '报名成为群成员';
    signupLink.setAttribute('href', shouldShowEdit ? '/vip/edit' : '/vip/signup');
  }

  function buildFingerprintSource() {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    const navInfo = window.navigator || {};
    const screenInfo = window.screen || {};

    return [
      navInfo.userAgent || '',
      navInfo.language || '',
      Array.isArray(navInfo.languages) ? navInfo.languages.join(',') : '',
      navInfo.platform || '',
      String(navInfo.hardwareConcurrency || ''),
      String(navInfo.deviceMemory || ''),
      timezone,
      String(screenInfo.width || ''),
      String(screenInfo.height || ''),
      String(screenInfo.colorDepth || ''),
      String(window.devicePixelRatio || ''),
      String('ontouchstart' in window),
      String(new Date().getTimezoneOffset()),
    ].join('|');
  }

  async function hashFingerprint(value) {
    if (!value) {
      return '';
    }

    if (window.crypto && window.crypto.subtle && typeof window.TextEncoder === 'function') {
      const bytes = new window.TextEncoder().encode(value);
      const digest = await window.crypto.subtle.digest('SHA-256', bytes);
      return Array.from(new Uint8Array(digest))
        .map((byte) => byte.toString(16).padStart(2, '0'))
        .join('');
    }

    let hash = 0;
    for (let index = 0; index < value.length; index += 1) {
      hash = ((hash << 5) - hash) + value.charCodeAt(index);
      hash |= 0;
    }

    return `fallback-${Math.abs(hash)}`;
  }

  function readStoredFingerprint() {
    try {
      const value = window.localStorage.getItem(fingerprintStorageKey) || '';
      return String(value).trim();
    } catch (error) {
      return '';
    }
  }

  function writeStoredFingerprint(value) {
    if (!value) {
      return;
    }

    try {
      window.localStorage.setItem(fingerprintStorageKey, value);
    } catch (error) {
      // Ignore storage failures.
    }
  }

  async function generatePersistentFingerprint() {
    const existing = readStoredFingerprint();
    if (existing) {
      return existing;
    }

    const source = buildFingerprintSource();
    if (!source) {
      return '';
    }

    const fingerprint = await hashFingerprint(source);
    writeStoredFingerprint(fingerprint);
    return fingerprint;
  }

  async function loadExistingProfileFlag() {
    if (searchParams.has('debug')) {
      writeExistingProfileFlag(false);
      syncSignupLink(false);
      return;
    }

    const fingerprint = await generatePersistentFingerprint();
    if (!fingerprint) {
      writeExistingProfileFlag(false);
      syncSignupLink(false);
      return;
    }

    const response = await fetch(`/api/vip-signup-profile.php?fingerprint=${encodeURIComponent(fingerprint)}`, {
      method: 'GET',
      cache: 'no-store',
    });
    const result = await response.json().catch(() => null);

    if (!response.ok || !result || !result.ok) {
      return;
    }

    const hasExistingProfile = Boolean(result.data && result.data.item);
    writeExistingProfileFlag(hasExistingProfile);
    syncSignupLink(hasExistingProfile);
  }

  syncSignupLink(readExistingProfileFlag());

  loadExistingProfileFlag().catch(() => {
    // Leave the last known nav state in place if lookup fails.
  });
})();
