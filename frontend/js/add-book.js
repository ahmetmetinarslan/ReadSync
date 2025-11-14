(function () {
  const utils = window.ReadSyncUtils;
  const api = window.ReadSyncApi;
  const OPEN_LIBRARY_ENDPOINT = 'https://openlibrary.org/search.json';
  const OPEN_LIBRARY_FIELDS =
    'key,title,author_name,cover_i,isbn,number_of_pages_median,first_publish_year';

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
    const isbnInput = bookForm.querySelector('input[name="isbn"]');
    const coverUrlInput = bookForm.querySelector('input[name="cover_url"]');
    const coverPreview = document.getElementById('cover-preview');
    const coverPreviewImage = document.getElementById('cover-preview-image');
    const coverPreviewRemove = document.getElementById('cover-preview-remove');
    const searchForm = document.getElementById('book-search-form');
    const searchInput = document.getElementById('book-search-input');
    const searchModal = document.getElementById('book-search-modal');
    const searchResultsList = document.getElementById('book-search-results');
    const searchStatus = document.getElementById('book-search-status');
    const searchClose = document.getElementById('book-search-close');
    const searchInlineAlert = document.getElementById('book-search-inline-alert');

    let searchModalOpen = false;

    const normalizeOptional = (value) => {
      if (typeof value !== 'string') return null;
      const trimmed = value.trim();
      return trimmed.length ? trimmed : null;
    };

    const setSearchStatus = (message, tone = 'info') => {
      if (!searchStatus) return;
      searchStatus.textContent = message;
      searchStatus.dataset.state = tone;
    };

    const handleSearchEscape = (event) => {
      if (event.key === 'Escape') {
        closeSearchModal();
      }
    };

    const openSearchModal = () => {
      if (!searchModal || searchModalOpen) return;
      searchModal.hidden = false;
      searchModal.setAttribute('aria-hidden', 'false');
      searchModalOpen = true;
      document.addEventListener('keydown', handleSearchEscape);
    };

    const closeSearchModal = () => {
      if (!searchModal || !searchModalOpen) return;
      searchModal.hidden = true;
      searchModal.setAttribute('aria-hidden', 'true');
      searchModalOpen = false;
      document.removeEventListener('keydown', handleSearchEscape);
    };

    const renderCoverPreview = (value) => {
      if (!coverPreview || !coverPreviewImage) {
        return;
      }
      if (value) {
        coverPreviewImage.src = value;
        coverPreview.hidden = false;
      } else {
        coverPreviewImage.removeAttribute('src');
        coverPreview.hidden = true;
      }
    };

    const setCoverUrl = (value) => {
      if (coverUrlInput) {
        coverUrlInput.value = value || '';
      }
      renderCoverPreview(value || '');
    };

    const buildPayload = () => {
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
        isbn: normalizeOptional(data.isbn),
        cover_url: normalizeOptional(data.cover_url),
      };
    };

    const mapDocToResult = (doc) => {
      if (!doc || !doc.title) {
        return null;
      }
      const isbnList = Array.isArray(doc.isbn) ? doc.isbn : [];
      const preferredIsbn =
        isbnList.find((value) => value && value.length === 13) || isbnList[0] || null;
      const coverId = doc.cover_i;
      let coverUrl = null;
      if (coverId) {
        coverUrl = `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`;
      } else if (preferredIsbn) {
        coverUrl = `https://covers.openlibrary.org/b/isbn/${preferredIsbn}-L.jpg`;
      }
      return {
        key: doc.key || `${doc.title}-${Math.random()}`,
        title: doc.title,
        author: Array.isArray(doc.author_name) && doc.author_name.length ? doc.author_name[0] : '',
        year: doc.first_publish_year || null,
        pages: doc.number_of_pages_median || null,
        isbn: preferredIsbn,
        coverUrl,
      };
    };

    const renderSearchResults = (results, query) => {
      if (!searchResultsList) {
        return;
      }
      searchResultsList.innerHTML = '';

      if (!results.length) {
        setSearchStatus(`No matches for "${query}". Try a different title or ISBN.`, 'error');
        return;
      }

      setSearchStatus(
        `Showing ${results.length} result${results.length === 1 ? '' : 's'}. Pick one to fill the form.`,
        'info'
      );

      const fragment = document.createDocumentFragment();
      results.forEach((result) => {
        const card = document.createElement('article');
        card.className = 'search-result-card';

        if (result.coverUrl) {
          const image = document.createElement('img');
          image.src = result.coverUrl;
          image.alt = `${result.title} cover`;
          image.loading = 'lazy';
          image.className = 'search-result-cover';
          card.appendChild(image);
        }

        const body = document.createElement('div');
        body.className = 'search-result-body';

        const title = document.createElement('h3');
        title.textContent = result.title;
        body.appendChild(title);

        if (result.author) {
          const author = document.createElement('p');
          author.className = 'search-result-author';
          author.textContent = result.author;
          body.appendChild(author);
        }

        const meta = document.createElement('p');
        meta.className = 'search-result-meta';
        const metaParts = [];
        if (result.year) {
          metaParts.push(`Year ${result.year}`);
        }
        if (result.pages) {
          metaParts.push(`${result.pages} pages`);
        }
        if (result.isbn) {
          metaParts.push(`ISBN ${result.isbn}`);
        }
        meta.textContent = metaParts.join(' • ') || 'No extra details available.';
        body.appendChild(meta);

        const actions = document.createElement('div');
        actions.className = 'search-result-actions';
        const useButton = document.createElement('button');
        useButton.type = 'button';
        useButton.className = 'btn btn-primary btn-sm';
        useButton.textContent = 'Use this book';
        useButton.addEventListener('click', () => {
          applyResultToForm(result);
          closeSearchModal();
        });
        actions.appendChild(useButton);
        body.appendChild(actions);
        card.appendChild(body);
        fragment.appendChild(card);
      });

      searchResultsList.appendChild(fragment);
    };

    const applyResultToForm = (result) => {
      if (!bookForm) {
        return;
      }
      bookForm.title.value = result.title || '';
      bookForm.author.value = result.author || '';
      if (bookForm.pages) {
        bookForm.pages.value = result.pages ?? '';
      }
      if (bookForm.current_page) {
        bookForm.current_page.value = 0;
      }
      if (isbnInput) {
        isbnInput.value = result.isbn || '';
      }
      setCoverUrl(result.coverUrl || '');
      utils.showAlert(
        alertEl,
        'Book details filled from Open Library. Review and save when ready.',
        'success'
      );
    };

    const searchOpenLibrary = async (query) => {
      const url = new URL(OPEN_LIBRARY_ENDPOINT);
      url.searchParams.set('q', query);
      url.searchParams.set('limit', '15');
      url.searchParams.set('fields', OPEN_LIBRARY_FIELDS);
      let response;
      try {
        response = await fetch(url.toString());
      } catch (networkError) {
        const error = new Error('Unable to reach Open Library. Check your connection and try again.');
        error.cause = networkError;
        throw error;
      }
      if (!response.ok) {
        throw new Error('Open Library search failed. Please try again.');
      }
      const payload = await response.json();
      const docs = Array.isArray(payload.docs) ? payload.docs : [];
      return docs
        .map(mapDocToResult)
        .filter((item) => !!item)
        .slice(0, 10);
    };

    const clearSearchInlineAlert = () => {
      if (searchInlineAlert) {
        utils.clearAlert(searchInlineAlert);
      }
    };

    searchForm?.addEventListener('submit', async (event) => {
      event.preventDefault();
      clearSearchInlineAlert();
      const query = searchInput?.value.trim();
      if (!query) {
        utils.showAlert(searchInlineAlert, 'Enter a title or ISBN to search.');
        searchInput?.focus();
        return;
      }
      openSearchModal();
      if (searchResultsList) {
        searchResultsList.innerHTML = '';
      }
      setSearchStatus(`Searching for "${query}"...`, 'info');
      try {
        const results = await searchOpenLibrary(query);
        renderSearchResults(results, query);
      } catch (error) {
        setSearchStatus(error.message || 'Unable to search right now.', 'error');
      }
    });

    searchClose?.addEventListener('click', closeSearchModal);
    searchModal?.addEventListener('click', (event) => {
      if (event.target === searchModal) {
        closeSearchModal();
      }
    });

    coverUrlInput?.addEventListener('input', (event) => {
      renderCoverPreview(event.target.value.trim());
    });

    coverPreviewRemove?.addEventListener('click', () => {
      setCoverUrl('');
    });

    bookForm.addEventListener('reset', () => {
      setCoverUrl('');
    });

    function buildAndValidatePayload() {
      const payload = buildPayload();
      if (!payload.title || !payload.author) {
        utils.showAlert(alertEl, 'Title and author are required.');
        return null;
      }
      return payload;
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

      const payload = buildAndValidatePayload();
      if (!payload) {
        return;
      }

      submitButton.disabled = true;
      try {
        await api.createBook(payload);
        bookForm.reset();
        setCoverUrl('');
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
