/* tmdb-search.js — Discover page.  Debounced TMDb search + import-to-catalog. */
(function () {
  let debounceTimer = null;
  let currentQueryToken = 0;
  let input;
  let results;
  let statusEl;

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    Nav.render('discover');

    input = document.getElementById('tmdb-search-input');
    results = document.getElementById('tmdb-results');
    statusEl = document.getElementById('tmdb-status');

    input.addEventListener('input', onInput);
    input.focus();

    showStatus('Type a title above to search.');
  }

  function onInput() {
    const q = input.value.trim();
    clearTimeout(debounceTimer);

    if (!q) {
      currentQueryToken += 1;
      results.innerHTML = '';
      results.setAttribute('aria-busy', 'false');
      showStatus('Type a title above to search.');
      return;
    }

    showSkeleton();
    debounceTimer = setTimeout(() => run(q), 300);
  }

  async function run(q) {
    const token = ++currentQueryToken;
    try {
      const data = await API.searchTmdb(q);
      if (token !== currentQueryToken) return; // stale
      const list = (data && data.results) || [];
      results.setAttribute('aria-busy', 'false');
      if (!list.length) {
        results.innerHTML = '';
        showStatus('No matches on TMDb for "' + q + '".');
        return;
      }
      renderResults(list);
    } catch (err) {
      if (token !== currentQueryToken) return;
      results.innerHTML = '';
      results.setAttribute('aria-busy', 'false');
      if (err.status === 503) {
        showStatus(
          'TMDb search is not configured yet. Add TMDB_API_KEY to your .env file ' +
          'and restart the server to enable this feature.'
        );
      } else {
        showStatus(err.message || 'Could not reach TMDb.');
      }
    }
  }

  function showStatus(msg) {
    statusEl.hidden = false;
    statusEl.textContent = msg;
  }

  function hideStatus() {
    statusEl.hidden = true;
    statusEl.textContent = '';
  }

  function showSkeleton() {
    hideStatus();
    results.setAttribute('aria-busy', 'true');
    results.innerHTML = '';
    for (let i = 0; i < 3; i++) {
      const row = document.createElement('div');
      row.className = 'tmdb-card tmdb-card--skeleton';
      row.innerHTML =
        '<div class="tmdb-card__poster skeleton"></div>' +
        '<div class="tmdb-card__body">' +
          '<div class="skeleton-card__line" style="width:60%"></div>' +
          '<div class="skeleton-card__line" style="width:40%"></div>' +
          '<div class="skeleton-card__line"></div>' +
          '<div class="skeleton-card__line skeleton-card__line--short"></div>' +
        '</div>';
      results.appendChild(row);
    }
  }

  function renderResults(list) {
    hideStatus();
    results.innerHTML = '';
    list.forEach((r) => results.appendChild(buildCard(r)));
  }

  function buildCard(r) {
    const card = document.createElement('article');
    card.className = 'tmdb-card';

    const posterWrap = document.createElement('div');
    posterWrap.className = 'tmdb-card__poster';
    if (r.poster_url) {
      const img = document.createElement('img');
      img.src = r.poster_url;
      img.alt = r.title + ' poster';
      img.loading = 'lazy';
      img.addEventListener('error', () => {
        posterWrap.innerHTML = '';
        const ph = document.createElement('div');
        ph.className = 'poster-placeholder';
        ph.textContent = '\uD83C\uDFAC';
        posterWrap.appendChild(ph);
      }, { once: true });
      posterWrap.appendChild(img);
    } else {
      const ph = document.createElement('div');
      ph.className = 'poster-placeholder';
      ph.textContent = '\uD83C\uDFAC';
      posterWrap.appendChild(ph);
    }
    card.appendChild(posterWrap);

    const body = document.createElement('div');
    body.className = 'tmdb-card__body';

    const title = document.createElement('h3');
    title.className = 'tmdb-card__title';
    title.textContent = r.title + (r.year ? ' (' + r.year + ')' : '');
    body.appendChild(title);

    if (r.overview) {
      const ov = document.createElement('p');
      ov.className = 'tmdb-card__overview';
      ov.textContent = r.overview;
      body.appendChild(ov);
    }

    const actions = document.createElement('div');
    actions.className = 'tmdb-card__actions';

    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'btn btn--primary';
    if (r.already_added) {
      setAlreadyAdded(addBtn, r.local_id);
    } else {
      addBtn.textContent = 'Add to catalog';
      addBtn.addEventListener('click', () => doImport(r, addBtn));
    }
    actions.appendChild(addBtn);
    body.appendChild(actions);

    card.appendChild(body);
    return card;
  }

  function setAlreadyAdded(btn, localId) {
    btn.disabled = true;
    btn.textContent = 'Already in catalog';
    btn.title = 'Click the title to open the movie';
    btn.onclick = null;
    if (localId) {
      btn.disabled = false;
      btn.textContent = 'Open in catalog';
      btn.addEventListener('click', () => MovieDetail.open(localId, btn));
    }
  }

  async function doImport(result, btn) {
    const user = Nav.getUser();
    if (!user) {
      Toast.show('Log in to import movies', 'error');
      return;
    }
    btn.disabled = true;
    btn.textContent = 'Adding...';
    try {
      const data = await API.importTmdb(result.tmdb_id);
      const movie = data && data.movie;
      if (!movie) throw new Error('Import failed');
      Toast.show('Added "' + movie.title + '" to the catalog');
      setAlreadyAdded(btn, movie.id);
    } catch (err) {
      // 409 means somebody else already added it — treat as success.
      if (err.status === 409 && err.data && err.data.movie) {
        Toast.show('Already in catalog');
        setAlreadyAdded(btn, err.data.movie.id);
        return;
      }
      if (err.status === 401) {
        Toast.show('Log in to import movies', 'error');
      } else if (err.status === 503) {
        Toast.show('TMDb is not configured', 'error');
      } else {
        Toast.show(err.message || 'Could not import', 'error');
      }
      btn.disabled = false;
      btn.textContent = 'Add to catalog';
    }
  }
})();
