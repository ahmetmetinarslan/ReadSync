(function () {
  const utils = window.ReadSyncUtils;
  const api = window.ReadSyncApi;

  document.addEventListener('DOMContentLoaded', async () => {
    const token = utils.requireAuth();
    if (!token) {
      return;
    }

    const bookForm = document.getElementById('book-form');
    if (!bookForm) {
      return;
    }

    const alertEl = document.getElementById('book-form-alert');
    const logoutButton = document.getElementById('logout-button');
    const welcomeBadge = document.getElementById('welcome-badge');
    const submitButton = document.getElementById('book-submit-button');

    function buildPayload() {
      const data = utils.serializeForm(bookForm);
      const pages = Number.parseInt(data.pages, 10);
      const currentPage = Number.parseInt(data.current_page, 10);
      return {
        title: data.title.trim(),
        author: data.author.trim(),
        status: data.status,
        pages: Number.isNaN(pages) ? null : pages,
        current_page: Number.isNaN(currentPage) ? 0 : currentPage,
        start_date: data.start_date || null,
        end_date: data.end_date || null,
      };
    }

    async function loadProfile() {
      try {
        const { user } = await api.getProfile();
        if (user && welcomeBadge) {
          welcomeBadge.textContent = `Hi, ${user.name}`;
          welcomeBadge.hidden = false;
        }
        if (user) {
          utils.saveSession({ token, user });
        }
      } catch (_error) {
        // ignore profile errors
      }
    }

    bookForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      utils.clearAlert(alertEl);

      if (!bookForm.reportValidity()) {
        return;
      }

      const payload = buildPayload();
      if (!payload.title || !payload.author) {
        utils.showAlert(alertEl, 'Title and author are required.');
        return;
      }

      submitButton.disabled = true;
      try {
        await api.createBook(payload);
        bookForm.reset();
        utils.showAlert(alertEl, 'Book saved! View it from My Books.', 'success');
      } catch (error) {
        utils.showAlert(alertEl, error.message || 'Unable to save book.');
      } finally {
        submitButton.disabled = false;
      }
    });

    logoutButton?.addEventListener('click', () => {
      utils.clearSession();
      window.location.replace('index.html');
    });

    await loadProfile();
  });
})();
