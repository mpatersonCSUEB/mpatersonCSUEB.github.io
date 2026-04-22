/* api.js — thin fetch wrapper for the Movie Review API.
   Exposes window.API. All URLs live here; no other file should hardcode /api/*. */
(function () {
  // The frontend is served by the same Express process that hosts the API,
  // so a plain relative base is always correct.
  const API_BASE = '/api';

  async function request(path, { method = 'GET', body } = {}) {
    const opts = {
      method,
      credentials: 'same-origin',
      headers: {}
    };
    if (body !== undefined) {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    }

    let res;
    try {
      res = await fetch(API_BASE + path, opts);
    } catch (networkErr) {
      const err = new Error('Network error — is the server running?');
      err.status = 0;
      err.cause = networkErr;
      throw err;
    }

    // Some endpoints (logout) may return 204 on some stacks; our API returns JSON.
    let data = null;
    const text = await res.text();
    if (text) {
      try { data = JSON.parse(text); }
      catch (_) { /* non-JSON body, leave as null */ }
    }

    if (!res.ok) {
      const message = (data && data.error) || `Request failed (${res.status})`;
      const err = new Error(message);
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  }

  function qs(params) {
    const entries = Object.entries(params || {}).filter(
      ([, v]) => v !== undefined && v !== null && v !== ''
    );
    if (!entries.length) return '';
    return '?' + entries.map(
      ([k, v]) => encodeURIComponent(k) + '=' + encodeURIComponent(v)
    ).join('&');
  }

  // ---- Movies -------------------------------------------------------------
  function getMovies({ genre, sort, order } = {}) {
    return request('/movies' + qs({ genre, sort, order }));
  }

  function getMovie(id) {
    return request('/movies/' + encodeURIComponent(id));
  }

  // ---- Reviews ------------------------------------------------------------
  function submitReview(movieId, { rating, comment }) {
    return request('/movies/' + encodeURIComponent(movieId) + '/reviews', {
      method: 'POST',
      body: { rating, comment }
    });
  }

  function likeReview(reviewId) {
    return request('/reviews/' + encodeURIComponent(reviewId) + '/like', {
      method: 'POST'
    });
  }

  // ---- Auth ---------------------------------------------------------------
  function register({ email, username, password }) {
    return request('/auth/register', {
      method: 'POST',
      body: { email, username, password }
    });
  }

  function login({ email, password }) {
    return request('/auth/login', {
      method: 'POST',
      body: { email, password }
    });
  }

  function logout() {
    return request('/auth/logout', { method: 'POST' });
  }

  async function getCurrentUser() {
    const data = await request('/auth/me');
    return data && data.user ? data.user : null;
  }

  // ---- Recommendations ----------------------------------------------------
  function getRecommendations(movieId) {
    return request('/movies/' + encodeURIComponent(movieId) + '/recommend');
  }

  // ---- TMDb ---------------------------------------------------------------
  function searchTmdb(q) {
    return request('/tmdb/search' + qs({ q }));
  }

  function importTmdb(tmdbId) {
    return request('/tmdb/import/' + encodeURIComponent(tmdbId), {
      method: 'POST'
    });
  }

  window.API = {
    API_BASE,
    getMovies,
    getMovie,
    submitReview,
    likeReview,
    register,
    login,
    logout,
    getCurrentUser,
    getRecommendations,
    searchTmdb,
    importTmdb
  };
})();
