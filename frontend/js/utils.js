(function () {
  const TOKEN_KEY = 'readsync_token';
  const USER_KEY = 'readsync_user';
  const THEME_KEY = 'readsync_theme';
  const DARK_MODE_START_HOUR = 19;
  const DARK_MODE_END_HOUR = 6;
  const themeToggleButtons = new Set();
  let activeTheme = 'light';
  let pendingThemeClass = null;

  function computeAutoTheme() {
    const hours = new Date().getHours();
    return hours >= DARK_MODE_START_HOUR || hours < DARK_MODE_END_HOUR ? 'dark' : 'light';
  }

  function getStoredThemePreference() {
    return localStorage.getItem(THEME_KEY);
  }

  function applyThemePreference(theme) {
    activeTheme = theme === 'dark' ? 'dark' : 'light';
    const className = activeTheme === 'dark' ? 'theme-dark' : 'theme-light';
    if (document.body) {
      document.body.classList.remove('theme-light', 'theme-dark');
      document.body.classList.add(className);
    } else {
      pendingThemeClass = className;
    }
    return activeTheme;
  }

  function getTheme() {
    return activeTheme;
  }

  function refreshThemeToggleButtons() {
    if (!themeToggleButtons.size) {
      return;
    }
    const theme = getTheme();
    const label = theme === 'dark' ? 'Switch to day mode' : 'Switch to night mode';
    const icon = theme === 'dark' ? '☀️' : '🌙';
    const pressed = theme === 'dark' ? 'true' : 'false';
    themeToggleButtons.forEach((button) => {
      button.textContent = icon;
      button.setAttribute('aria-label', label);
      button.setAttribute('title', label);
      button.setAttribute('aria-pressed', pressed);
    });
  }

  function setThemePreference(theme, { persist = true } = {}) {
    const applied = applyThemePreference(theme);
    if (persist) {
      localStorage.setItem(THEME_KEY, applied);
    }
    refreshThemeToggleButtons();
    return applied;
  }

  function toggleThemePreference() {
    const next = getTheme() === 'dark' ? 'light' : 'dark';
    return setThemePreference(next);
  }

  function setupThemeToggle(button) {
    if (!button || themeToggleButtons.has(button)) {
      return;
    }
    themeToggleButtons.add(button);
    button.addEventListener('click', () => {
      toggleThemePreference();
    });
    refreshThemeToggleButtons();
  }

  (function initializeTheme() {
    const stored = getStoredThemePreference();
    const initial = stored === 'light' || stored === 'dark' ? stored : computeAutoTheme();
    applyThemePreference(initial);
  })();

  function saveSession({ token, user }) {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    }
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
  }

  function getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  function getUser() {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (_error) {
      return null;
    }
  }

  function clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  function requireAuth() {
    const token = getToken();
    if (!token) {
      window.location.replace('login.html');
    }
    return token;
  }

  function redirectIfAuthenticated() {
    if (getToken()) {
      window.location.replace('books.html');
    }
  }

  function serializeForm(form) {
    const data = new FormData(form);
    return Object.fromEntries(data.entries());
  }

  function showAlert(el, message, type = 'error') {
    if (!el) return;
    el.textContent = message;
    el.hidden = false;
    el.classList.remove('alert-error', 'alert-success');
    el.classList.add(type === 'success' ? 'alert-success' : 'alert-error');
  }

  function clearAlert(el) {
    if (!el) return;
    el.hidden = true;
    el.textContent = '';
  }

  function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (pendingThemeClass && document.body) {
      document.body.classList.remove('theme-light', 'theme-dark');
      document.body.classList.add(pendingThemeClass);
      pendingThemeClass = null;
    }
    const toggles = document.querySelectorAll('[data-theme-toggle]');
    toggles.forEach((button) => setupThemeToggle(button));
  });

  window.ReadSyncUtils = {
    saveSession,
    getToken,
    getUser,
    clearSession,
    requireAuth,
    redirectIfAuthenticated,
    serializeForm,
    showAlert,
    clearAlert,
    formatDate,
    getTheme,
    setThemePreference,
    toggleThemePreference,
    setupThemeToggle,
  };
})();

