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
    const currentlyReadingSection = document.getElementById('currently-reading-section');
    const currentlyReadingList = document.getElementById('active-books');
    const currentlyReadingScroll = document.getElementById('currently-reading-scroll');
    const allBooksSection = document.getElementById('all-books-section');

    if (!booksContainer || !emptyState) {
      return;
    }

    currentlyReadingScroll?.addEventListener('click', () => {
      const target = allBooksSection || booksContainer;
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

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

    function partitionBooks() {
      const active = [];
      const others = [];
      state.books.forEach((book) => {
        if (book.status === 'reading') {
          active.push(book);
        } else {
          others.push(book);
        }
      });
      return { active, others };
    }

    function createCurrentlyReadingCard(book) {
      const card = document.createElement('article');
      card.className = 'currently-reading-card';

      const cover = document.createElement('div');
      cover.className = 'currently-reading-cover';
      if (book.cover_url) {
        const img = document.createElement('img');
        img.src = book.cover_url;
        img.alt = `${book.title} cover`;
        img.loading = 'lazy';
        cover.appendChild(img);
      } else {
        cover.textContent = 'No cover';
      }
      card.appendChild(cover);

      const body = document.createElement('div');
      body.className = 'currently-reading-body';
      card.appendChild(body);

      const label = document.createElement('span');
      label.className = 'currently-reading-label';
      label.textContent = 'Continue reading';
      body.appendChild(label);

      const title = document.createElement('h3');
      title.textContent = book.title;
      body.appendChild(title);

      const author = document.createElement('p');
      author.className = 'currently-reading-author';
      author.textContent = `by ${book.author}`;
      body.appendChild(author);

      const hasTotalPages = typeof book.pages === 'number' && book.pages > 0;
      const currentPageValue = Number(book.current_page ?? 0);
      const currentPage = Number.isFinite(currentPageValue) ? currentPageValue : 0;
      const percent = hasTotalPages
        ? Math.min(100, Math.max(0, (currentPage / book.pages) * 100))
        : 0;
      const roundedPercent = Math.round(percent);

      const progressWrap = document.createElement('div');
      progressWrap.className = 'currently-reading-progress';

      const progressText = document.createElement('p');
      progressText.className = 'currently-reading-progress-text';
      progressText.textContent = hasTotalPages
        ? `On page ${currentPage} of ${book.pages} (${roundedPercent}%)`
        : `On page ${currentPage}`;
      progressWrap.appendChild(progressText);

      const progressBar = document.createElement('div');
      progressBar.className = 'currently-reading-progress-bar';
      const progressFill = document.createElement('span');
      progressFill.style.width = `${percent}%`;
      progressBar.appendChild(progressFill);
      progressWrap.appendChild(progressBar);
      body.appendChild(progressWrap);

      if (book.start_date) {
        const started = document.createElement('p');
        started.className = 'currently-reading-meta';
        started.textContent = `Started ${utils.formatDate(book.start_date)}`;
        body.appendChild(started);
      }

      const inputsRow = document.createElement('div');
      inputsRow.className = 'currently-reading-inputs';

      const progressInput = document.createElement('input');
      progressInput.type = 'number';
      progressInput.min = '1';
      progressInput.value = '';
      progressInput.placeholder = 'Pages read today';
      progressInput.setAttribute('aria-label', `${book.title} pages read today`);
      progressInput.inputMode = 'numeric';
      if (hasTotalPages) {
        const remaining = Math.max(0, book.pages - currentPage);
        if (remaining > 0) {
          progressInput.max = String(remaining);
        }
      }
      inputsRow.appendChild(progressInput);

      const saveButton = document.createElement('button');
      saveButton.className = 'btn btn-primary btn-sm';
      saveButton.type = 'button';
      saveButton.textContent = 'Add progress';
      saveButton.addEventListener('click', async () => {
        const increment = Number.parseInt(progressInput.value, 10);
        if (Number.isNaN(increment) || increment <= 0) {
          window.alert('Enter how many pages you read.');
          return;
        }
        saveButton.disabled = true;
        try {
          await saveProgress(
            book.id,
            currentPage + increment,
            hasTotalPages ? book.pages : null,
          );
          progressInput.value = '';
        } catch (error) {
          window.alert(error.message || 'Unable to update progress.');
        } finally {
          saveButton.disabled = false;
        }
      });
      progressInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          saveButton.click();
        }
      });
      inputsRow.appendChild(saveButton);
      body.appendChild(inputsRow);

      const actions = document.createElement('div');
      actions.className = 'currently-reading-actions';

      const finishButton = document.createElement('button');
      finishButton.className = 'btn btn-secondary btn-sm';
      finishButton.type = 'button';
      finishButton.textContent = 'Mark finished';
      finishButton.addEventListener('click', async () => {
        finishButton.disabled = true;
        try {
          await updateStatus(book.id, 'finished');
        } catch (error) {
          window.alert(error.message || 'Unable to update status.');
        } finally {
          finishButton.disabled = false;
        }
      });
      actions.appendChild(finishButton);

      const editButton = document.createElement('button');
      editButton.className = 'btn btn-outline btn-sm';
      editButton.type = 'button';
      editButton.textContent = 'Edit details';
      editButton.addEventListener('click', () => setEditing(book));
      actions.appendChild(editButton);

      body.appendChild(actions);
      return card;
    }

    function renderCurrentlyReading(activeBooks) {
      if (!currentlyReadingList || !currentlyReadingSection) {
        return;
      }
      if (!activeBooks.length) {
        currentlyReadingList.innerHTML = '';
        currentlyReadingSection.hidden = true;
        return;
      }

      currentlyReadingSection.hidden = false;
      currentlyReadingList.innerHTML = '';
      const fragment = document.createDocumentFragment();
      activeBooks.forEach((book) => {
        fragment.appendChild(createCurrentlyReadingCard(book));
      });
      currentlyReadingList.appendChild(fragment);
    }

    function renderBooks() {
      const { active, others } = partitionBooks();
      renderCurrentlyReading(active);
      renderBookGrid(others, state.books.length);
    }

    function renderBookGrid(books, totalCount) {
      booksContainer.innerHTML = '';
      if (!totalCount) {
        emptyState.hidden = false;
        return;
      }

      emptyState.hidden = true;
      if (!books.length) {
        const placeholder = document.createElement('p');
        placeholder.className = 'all-books-placeholder';
        placeholder.textContent = 'Planned and finished books will appear here once you add them.';
        booksContainer.appendChild(placeholder);
        return;
      }

      const fragment = document.createDocumentFragment();

      books.forEach((book) => {
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
