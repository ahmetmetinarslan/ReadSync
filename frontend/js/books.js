(function () {
  const utils = window.ReadSyncUtils;
  const api = window.ReadSyncApi;

  const state = {
    books: [],
    editingId: null,
  };

  document.addEventListener('DOMContentLoaded', async () => {
    const token = utils.requireAuth();
    if (!token) {
      return;
    }

    const bookForm = document.getElementById('book-form');
    const alertEl = document.getElementById('book-form-alert');
    const booksContainer = document.getElementById('books-container');
    const emptyState = document.getElementById('books-empty');
    const logoutButton = document.getElementById('logout-button');
    const cancelButton = document.getElementById('cancel-edit');
    const submitButton = document.getElementById('book-submit-button');
    const welcomeBadge = document.getElementById('welcome-badge');

    function resetForm() {
      state.editingId = null;
      bookForm.reset();
      submitButton.textContent = 'Save Book';
      cancelButton.hidden = true;
      utils.clearAlert(alertEl);
    }

    function setEditing(book) {
      state.editingId = book.id;
      bookForm.title.value = book.title;
      bookForm.author.value = book.author;
      bookForm.pages.value = book.pages ?? '';
      bookForm.status.value = book.status;
      bookForm.start_date.value = book.start_date ?? '';
      bookForm.end_date.value = book.end_date ?? '';
      submitButton.textContent = 'Update Book';
      cancelButton.hidden = false;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

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
        if (meta.childElementCount) {
          card.appendChild(meta);
        }

        const actions = document.createElement('div');
        actions.className = 'book-actions';

        const editButton = document.createElement('button');
        editButton.className = 'btn btn-outline';
        editButton.type = 'button';
        editButton.textContent = 'Edit';
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

    function buildPayload() {
      const data = utils.serializeForm(bookForm);
      const pages = Number.parseInt(data.pages, 10);
      return {
        title: data.title.trim(),
        author: data.author.trim(),
        status: data.status,
        pages: Number.isNaN(pages) ? null : pages,
        start_date: data.start_date || null,
        end_date: data.end_date || null,
      };
    }

    async function loadBooks() {
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

      try {
        if (state.editingId) {
          const { book } = await api.updateBook(state.editingId, payload);
          state.books = state.books.map((item) => (item.id === book.id ? book : item));
          renderBooks();
          resetForm();
        } else {
          const { book } = await api.createBook(payload);
          state.books = [book, ...state.books];
          renderBooks();
          resetForm();
        }
      } catch (error) {
        utils.showAlert(alertEl, error.message || 'Unable to save book.');
      }
    });

    cancelButton.addEventListener('click', () => {
      resetForm();
    });

    logoutButton.addEventListener('click', () => {
      utils.clearSession();
      window.location.replace('index.html');
    });

    await Promise.all([loadProfile(), loadBooks()]);
  });
})();


