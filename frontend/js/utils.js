(function () {
  const TOKEN_KEY = 'readsync_token';
  const USER_KEY = 'readsync_user';

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
  };
})();

