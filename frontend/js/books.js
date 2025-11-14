(function () {
  const utils = window.ReadSyncUtils;
  const api = window.ReadSyncApi;

  const STATUS_OPTIONS = ['planned', 'reading', 'finished'];

  const state = {
    books: [],
    editingId: null,
  };

  document.addEventListener('DOMContentLoaded', async () => {
    const token = utils.requireAuth();
    if (!token) {
      return;
    }

    const booksContainer = document.getElementById('books-container');
    const emptyState = document.getElementById('books-empty');
    const alertEl = document.getElementById('books-alert');
    const logoutButton = document.getElementById('logout-button');
    const welcomeBadge = document.getElementById('welcome-badge');
    const editorModal = document.getElementById('book-editor-modal');
    const editorForm = document.getElementById('book-editor-form');
    const editorAlert = document.getElementById('editor-alert');
    const editorClose = document.getElementById('editor-close');
    const editorCancel = document.getElementById('editor-cancel');
    const editorSubmit = document.getElementById('editor-submit');

    if (!booksContainer || !emptyState) {
      return;
    }

    function resetForm() {
      state.editingId = null;
      if (editorForm) {
        editorForm.reset();
      }
      utils.clearAlert(editorAlert);
      if (editorSubmit) {
        editorSubmit.textContent = 'Save Book';
      }
      if (editorCancel) {
        editorCancel.hidden = true;
      }
      if (editorModal) {
        editorModal.hidden = true;
        editorModal.setAttribute('aria-hidden', 'true');
      }
    }

    function setEditing(book) {
      if (!editorModal || !editorForm) return;
      state.editingId = book.id;
      editorForm.title.value = book.title;
      editorForm.author.value = book.author;
      editorForm.pages.value = book.pages ?? '';
      editorForm.status.value = book.status;
      editorForm.start_date.value = book.start_date ?? '';
      editorForm.end_date.value = book.end_date ?? '';
      if (editorForm.isbn) {
        editorForm.isbn.value = book.isbn ?? '';
      }
      if (editorForm.cover_url) {
        editorForm.cover_url.value = book.cover_url ?? '';
      }
      if (editorSubmit) {
        editorSubmit.textContent = 'Update Book';
      }
      if (editorCancel) {
        editorCancel.hidden = false;
      }
      editorModal.hidden = false;
      editorModal.setAttribute('aria-hidden', 'false');
    }

    // Ensure the form starts in "add" mode.
    resetForm();

    function renderBooks() {
      booksContainer.innerHTML = '';
      if (!state.books.length) {
        emptyState.hidden = false;
        return;
      }

      emptyState.hidden = true;
      const fragment = document.createDocumentFragment();

      state.books.forEach((book) => {
        const card = document.createElement('article');
        card.className = 'book-card';
        card.dataset.id = book.id;

        if (book.cover_url) {
          const coverImage = document.createElement('img');
          coverImage.src = book.cover_url;
          coverImage.alt = `${book.title} cover`;
          coverImage.loading = 'lazy';
          coverImage.className = 'book-card-cover';
          card.appendChild(coverImage);
        }

        const title = document.createElement('h3');
        title.textContent = book.title;
        card.appendChild(title);

        const author = document.createElement('p');
        author.style.color = 'var(--color-muted)';
        author.textContent = `by ${book.author}`;
        card.appendChild(author);

        const badge = document.createElement('span');
        badge.className = 'badge';
        badge.textContent = book.status.charAt(0).toUpperCase() + book.status.slice(1);
        card.appendChild(badge);

        const meta = document.createElement('div');
        meta.className = 'meta';
        if (book.pages) {
          const pages = document.createElement('span');
          pages.textContent = `${book.pages} pages`;
          meta.appendChild(pages);
        }
        if (book.start_date) {
          const start = document.createElement('span');
          start.textContent = `Started ${utils.formatDate(book.start_date)}`;
          meta.appendChild(start);
        }
        if (book.end_date) {
          const end = document.createElement('span');
          end.textContent = `Finished ${utils.formatDate(book.end_date)}`;
          meta.appendChild(end);
        }
        if (book.isbn) {
          const isbn = document.createElement('span');
          isbn.textContent = `ISBN ${book.isbn}`;
          meta.appendChild(isbn);
        }
        if (meta.childElementCount) {
          card.appendChild(meta);
        }

        const hasTotalPages = typeof book.pages === 'number' && book.pages > 0;
        const currentPageValue = Number(book.current_page ?? 0);
        const currentPage = Number.isFinite(currentPageValue) ? currentPageValue : 0;
        const percent = hasTotalPages
          ? Math.min(100, Math.max(0, (currentPage / book.pages) * 100))
          : 0;
        const roundedPercent = Math.round(percent);

        const progressWrapper = document.createElement('div');
        progressWrapper.className = 'book-progress';

        const progressLabel = document.createElement('span');
        progressLabel.className = 'book-progress-label';
        progressLabel.textContent = hasTotalPages
          ? `Progress: ${currentPage} / ${book.pages} (${roundedPercent}%)`
          : `Current page: ${currentPage}`;
        progressWrapper.appendChild(progressLabel);

        const progressBar = document.createElement('div');
        progressBar.className = 'book-progress-bar';

        const progressFill = document.createElement('div');
        progressFill.className = 'book-progress-bar-fill';
        progressFill.style.width = `${percent}%`;
        progressBar.appendChild(progressFill);

        progressWrapper.appendChild(progressBar);
        card.appendChild(progressWrapper);

        const progressControls = document.createElement('div');
        progressControls.className = 'progress-controls';
        progressControls.setAttribute('aria-label', `Update progress for ${book.title}`);

        const progressInput = document.createElement('input');
        progressInput.type = 'number';
        progressInput.min = '0';
        progressInput.value = book.current_page ?? 0;
        progressInput.setAttribute('aria-label', `${book.title} new current page`);
        if (hasTotalPages) {
          progressInput.max = String(book.pages);
        }
        progressControls.appendChild(progressInput);

        const progressButton = document.createElement('button');
        progressButton.className = 'btn btn-outline';
        progressButton.type = 'button';
        progressButton.textContent = 'Save progress';
        progressButton.addEventListener('click', async () => {
          const rawValue = Number.parseInt(progressInput.value, 10);
          progressButton.disabled = true;
          try {
            await saveProgress(book.id, rawValue, hasTotalPages ? book.pages : null);
          } catch (error) {
            window.alert(error.message || 'Unable to update progress.');
          } finally {
            progressButton.disabled = false;
          }
        });
        progressInput.addEventListener('keydown', (event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            progressButton.click();
          }
        });
        progressControls.appendChild(progressButton);
        card.appendChild(progressControls);

        const statusControl = document.createElement('label');
        statusControl.className = 'status-control';
        statusControl.textContent = 'Status';

        const statusSelect = document.createElement('select');
        STATUS_OPTIONS.forEach((option) => {
          const opt = document.createElement('option');
          opt.value = option;
          opt.textContent = option.charAt(0).toUpperCase() + option.slice(1);
          statusSelect.appendChild(opt);
        });
        statusSelect.value = book.status;
        statusSelect.addEventListener('change', async () => {
          statusSelect.disabled = true;
          try {
            await updateStatus(book.id, statusSelect.value);
          } catch (error) {
            window.alert(error.message || 'Unable to update status.');
            statusSelect.value = book.status;
          } finally {
            statusSelect.disabled = false;
          }
        });
        statusControl.appendChild(statusSelect);
        card.appendChild(statusControl);

        const actions = document.createElement('div');
        actions.className = 'book-actions';

        const editButton = document.createElement('button');
        editButton.className = 'btn btn-outline';
        editButton.type = 'button';
        editButton.textContent = 'Edit details';
        editButton.addEventListener('click', () => setEditing(book));
        actions.appendChild(editButton);

        const deleteButton = document.createElement('button');
        deleteButton.className = 'btn btn-danger';
        deleteButton.type = 'button';
        deleteButton.textContent = 'Delete';
        deleteButton.addEventListener('click', async () => {
          const confirmDelete = window.confirm('Delete this book? This action cannot be undone.');
          if (!confirmDelete) {
            return;
          }
          try {
            await api.deleteBook(book.id);
            state.books = state.books.filter((item) => item.id !== book.id);
            renderBooks();
            if (state.editingId === book.id) {
              resetForm();
            }
          } catch (error) {
            window.alert(error.message || 'Failed to delete book.');
          }
        });
        actions.appendChild(deleteButton);

        card.appendChild(actions);
        fragment.appendChild(card);
      });

      booksContainer.appendChild(fragment);
    }

    function normalizeOptionalText(value) {
      if (typeof value !== 'string') {
        return null;
      }
      const trimmed = value.trim();
      return trimmed.length ? trimmed : null;
    }

    function buildEditorPayload() {
      const data = utils.serializeForm(editorForm);
      const pages = Number.parseInt(data.pages, 10);
      return {
        title: data.title.trim(),
        author: data.author.trim(),
        status: data.status,
        pages: Number.isNaN(pages) ? null : pages,
        start_date: data.start_date || null,
        end_date: data.end_date || null,
        isbn: normalizeOptionalText(data.isbn),
        cover_url: normalizeOptionalText(data.cover_url),
      };
    }

    function clampProgressValue(value, limit) {
      if (Number.isNaN(value) || value < 0) {
        return 0;
      }
      if (typeof limit === 'number' && limit >= 0) {
        return Math.min(value, limit);
      }
      return value;
    }

    async function saveProgress(id, value, limit) {
      const nextValue = clampProgressValue(value, limit);
      const { book } = await api.updateBook(id, { current_page: nextValue });
      state.books = state.books.map((item) => (item.id === book.id ? book : item));
      renderBooks();
    }

    async function updateStatus(id, status) {
      const { book } = await api.updateBook(id, { status });
      state.books = state.books.map((item) => (item.id === book.id ? book : item));
      renderBooks();
    }

    async function loadBooks() {
      utils.clearAlert(alertEl);
      try {
        const { books } = await api.getBooks();
        state.books = books;
        renderBooks();
      } catch (error) {
        utils.showAlert(alertEl, error.message || 'Unable to load books.');
      }
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

    editorForm?.addEventListener('submit', async (event) => {
      event.preventDefault();
      utils.clearAlert(editorAlert);

      if (!editorForm.reportValidity()) {
        return;
      }

      const payload = buildEditorPayload();
      if (!payload.title || !payload.author) {
        utils.showAlert(editorAlert, 'Title and author are required.');
        return;
      }

      if (editorSubmit) {
        editorSubmit.disabled = true;
      }
      try {
        if (state.editingId) {
          const { book } = await api.updateBook(state.editingId, payload);
          state.books = state.books.map((item) => (item.id === book.id ? book : item));
        } else {
          const { book } = await api.createBook(payload);
          state.books = [book, ...state.books];
        }
        renderBooks();
        resetForm();
      } catch (error) {
        utils.showAlert(editorAlert, error.message || 'Unable to save book.');
      } finally {
        if (editorSubmit) {
          editorSubmit.disabled = false;
        }
      }
    });

    editorCancel?.addEventListener('click', resetForm);
    editorClose?.addEventListener('click', resetForm);

    editorModal?.addEventListener('click', (event) => {
      if (event.target === editorModal) {
        resetForm();
      }
    });

    logoutButton?.addEventListener('click', () => {
      utils.clearSession();
      window.location.replace('index.html');
    });

    await Promise.all([loadProfile(), loadBooks()]);
  });
})();
