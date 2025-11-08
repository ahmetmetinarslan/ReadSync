(function () {
  const utils = window.ReadSyncUtils;
  const api = window.ReadSyncApi;

  document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    if (loginForm || registerForm) {
      utils.redirectIfAuthenticated();
    }

    if (loginForm) {
      const errorEl = document.getElementById('login-error');
      loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        utils.clearAlert(errorEl);

        if (!loginForm.reportValidity()) {
          return;
        }

        const data = utils.serializeForm(loginForm);
        try {
          const result = await api.login({
            email: data.email.trim().toLowerCase(),
            password: data.password,
          });
          utils.saveSession(result);
          window.location.replace('books.html');
        } catch (error) {
          utils.showAlert(errorEl, error.message || 'Unable to log in.');
        }
      });
    }

    if (registerForm) {
      const errorEl = document.getElementById('register-error');
      registerForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        utils.clearAlert(errorEl);

        if (!registerForm.reportValidity()) {
          return;
        }

        const data = utils.serializeForm(registerForm);
        if (data.password !== data.confirmPassword) {
          utils.showAlert(errorEl, 'Passwords do not match.');
          return;
        }

        try {
          const result = await api.register({
            name: data.name.trim(),
            email: data.email.trim().toLowerCase(),
            password: data.password,
          });
          utils.saveSession(result);
          window.location.replace('books.html');
        } catch (error) {
          utils.showAlert(errorEl, error.message || 'Unable to register.');
        }
      });
    }
  });
})();

