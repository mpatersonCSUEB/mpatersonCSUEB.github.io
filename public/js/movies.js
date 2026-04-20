/* movies.js — home page. Movie grid + search + sort/filter. */
(function () {
  const state = {
    genre: '',
    sort: 'title',
    order: 'asc',
    search: '',
    movies: []
  };

  let grid;
  let searchInput;
  let genreSelect;
  let sortPills;

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    Nav.render('home');

    grid = document.getElementById('movie-grid');
    searchInput = document.getElementById('search-input');
    genreSelect = document.getElementById('genre-filter');
    sortPills = document.querySelectorAll('.pill[data-sort]');

    searchInput.addEventListener('input', () => {
      state.search = searchInput.value.trim().toLowerCase();
      render();
    });

    genreSelect.addEventListener('change', () => {
      state.genre = genreSelect.value;
      load();
    });

    sortPills.forEach((p) => {
      p.addEventListener('click', () => {
        sortPills.forEach(other => other.classList.remove('pill--active'));
        p.classList.add('pill--active');
        state.sort = p.dataset.sort;
        state.order = p.dataset.order;
        load();
      });
    });

    load();
  }

  function skeletonGrid(count) {
    grid.innerHTML = '';
    grid.setAttribute('aria-busy', 'true');
    for (let i = 0; i < count; i++) {
      const sk = document.createElement('div');
      sk.className = 'skeleton-card';
      sk.innerHTML =
        '<div class="skeleton-card__poster"></div>' +
        '<div class="skeleton-card__info">' +
          '<div class="skeleton-card__line"></div>' +
          '<div class="skeleton-card__line skeleton-card__line--short"></div>' +
        '</div>';
      grid.appendChild(sk);
    }
  }

  async function load() {
    skeletonGrid(8);
    try {
      const data = await API.getMovies({
        genre: state.genre,
        sort: state.sort,
        order: state.order
      });
      state.movies = (data && data.movies) || [];
      render();
    } catch (err) {
      grid.innerHTML = '';
      grid.setAttribute('aria-busy', 'false');
      const empty = document.createElement('div');
      empty.className = 'empty';
      empty.textContent = err.message || 'Could not load movies.';
      grid.appendChild(empty);
      Toast.show(err.message || 'Could not load movies', 'error');
    }
  }

  function render() {
    grid.innerHTML = '';
    grid.setAttribute('aria-busy', 'false');

    const visible = state.movies.filter((m) => {
      if (!state.search) return true;
      return (m.title || '').toLowerCase().includes(state.search);
    });

    if (!visible.length) {
      const empty = document.createElement('div');
      empty.className = 'empty';
      empty.textContent = state.search
        ? `No movies match "${state.search}".`
        : 'No movies found.';
      grid.appendChild(empty);
      return;
    }

    visible.forEach((m) => grid.appendChild(buildCard(m)));
  }

  function buildCard(movie) {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'card';
    card.setAttribute('aria-label', `Open details for ${movie.title}`);

    // Poster
    const poster = document.createElement('div');
    poster.className = 'card__poster';

    if (movie.poster_url) {
      const img = document.createElement('img');
      img.src = movie.poster_url;
      img.alt = movie.title + ' poster';
      img.loading = 'lazy';
      img.addEventListener('error', () => {
        poster.innerHTML = '';
        poster.appendChild(posterPlaceholder());
        poster.appendChild(badge);
      }, { once: true });
      poster.appendChild(img);
    } else {
      poster.appendChild(posterPlaceholder());
    }

    const badge = document.createElement('div');
    badge.className = 'rating-badge';
    const avg = Number(movie.avg_rating) || 0;
    if (avg > 0) {
      badge.innerHTML =
        '<span class="rating-badge__star">\u2605</span>' +
        '<span>' + avg.toFixed(1) + '</span>';
      poster.appendChild(badge);
    }

    card.appendChild(poster);

    // Info
    const info = document.createElement('div');
    info.className = 'card__info';

    const title = document.createElement('h3');
    title.className = 'card__title';
    title.textContent = movie.title || 'Untitled';
    info.appendChild(title);

    const meta = document.createElement('div');
    meta.className = 'card__meta';
    const year = document.createElement('span');
    year.textContent = movie.year || '';
    meta.appendChild(year);

    const genres = UI.genreList(movie.genre);
    if (genres.length) {
      meta.appendChild(UI.renderGenreTag(genres[0]));
    }
    info.appendChild(meta);

    card.appendChild(info);

    card.addEventListener('click', () => {
      MovieDetail.open(movie.id, card);
    });

    return card;
  }

  function posterPlaceholder() {
    const ph = document.createElement('div');
    ph.className = 'poster-placeholder';
    ph.textContent = '\uD83C\uDFAC'; // 🎬
    ph.setAttribute('aria-hidden', 'true');
    return ph;
  }
})();
