(function () {
  const API_BASE = '/api';
  const utils = window.ReadSyncUtils;

  async function request(path, { method = 'GET', body, auth = false } = {}) {
    const headers = { 'Content-Type': 'application/json' };

    if (auth) {
      const token = utils.getToken();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }

    let response;
    try {
      response = await fetch(`${API_BASE}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch (networkError) {
      const error = new Error('Unable to reach the server. Please try again.');
      error.cause = networkError;
      throw error;
    }

    if (response.status === 204) {
      return null;
    }

    let payload;
    try {
      payload = await response.json();
    } catch (_error) {
      payload = { message: 'Unexpected server response.' };
    }

    if (!response.ok) {
      if (response.status === 401 && auth) {
        utils.clearSession();
        window.location.replace('login.html');
      }
      const error = new Error(payload.message || 'Request failed');
      error.status = response.status;
      throw error;
    }

    return payload;
  }

  function register(data) {
    return request('/auth/register', { method: 'POST', body: data });
  }

  function login(data) {
    return request('/auth/login', { method: 'POST', body: data });
  }

  function getProfile() {
    return request('/auth/profile', { auth: true });
  }

  function getBooks() {
    return request('/books', { auth: true });
  }

  function createBook(data) {
    return request('/books', { method: 'POST', body: data, auth: true });
  }

  function updateBook(id, data) {
    return request(`/books/${id}`, { method: 'PUT', body: data, auth: true });
  }

  function deleteBook(id) {
    return request(`/books/${id}`, { method: 'DELETE', auth: true });
  }

  window.ReadSyncApi = {
    register,
    login,
    getProfile,
    getBooks,
    createBook,
    updateBook,
    deleteBook,
  };
})();

