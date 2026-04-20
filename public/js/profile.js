/* profile.js — user profile page. Shows the user's own reviews aggregated
   across movies (API has no dedicated endpoint for this). */
(function () {
  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    Nav.render('reviews');
    const user = await Nav.ensureUser();
    if (!user) {
      window.location.replace('login.html');
      return;
    }
    const root = document.getElementById('profile-root');
    root.innerHTML = '';
    root.appendChild(buildHeader(user));

    const reviewsSection = document.createElement('div');
    reviewsSection.className = 'modal__section';
    const heading = document.createElement('h3');
    heading.className = 'section-heading';
    heading.textContent = 'My reviews';
    reviewsSection.appendChild(heading);

    const list = document.createElement('div');
    list.className = 'profile-reviews';
    list.textContent = 'Loading reviews...';
    list.style.color = 'var(--text-muted)';
    list.style.fontSize = '13px';
    reviewsSection.appendChild(list);
    root.appendChild(reviewsSection);

    root.setAttribute('aria-busy', 'false');

    try {
      const myReviews = await fetchMyReviews(user);
      list.innerHTML = '';
      list.style.color = '';
      list.style.fontSize = '';
      if (!myReviews.length) {
        const empty = document.createElement('div');
        empty.className = 'empty';
        empty.textContent = 'No reviews yet — go rate a movie!';
        list.appendChild(empty);
        return;
      }
      myReviews
        .sort((a, b) => String(b.review.created_at).localeCompare(String(a.review.created_at)))
        .forEach(({ movie, review }) => list.appendChild(buildReviewRow(movie, review)));
    } catch (err) {
      list.innerHTML = '';
      list.appendChild(errorBox(err.message || 'Could not load your reviews.'));
      Toast.show(err.message || 'Could not load your reviews', 'error');
    }
  }

  async function fetchMyReviews(user) {
    const list = await API.getMovies({});
    const movies = (list && list.movies) || [];
    const details = await Promise.all(
      movies.map((m) =>
        API.getMovie(m.id).then(d => d && d.movie).catch(() => null)
      )
    );
    const out = [];
    details.forEach((movie) => {
      if (!movie || !Array.isArray(movie.reviews)) return;
      movie.reviews.forEach((r) => {
        if (r.user && r.user.id === user.id) {
          out.push({ movie, review: r });
        }
      });
    });
    return out;
  }

  function buildHeader(user) {
    const wrap = document.createElement('div');
    wrap.className = 'profile-header';
    wrap.appendChild(UI.renderAvatar(user.username, { large: true }));

    const meta = document.createElement('div');
    const name = document.createElement('h1');
    name.className = 'profile-meta__name';
    name.textContent = user.username;
    meta.appendChild(name);

    const sub = document.createElement('p');
    sub.className = 'profile-meta__sub';
    sub.textContent = user.email ? user.email + ' · Member' : 'Member';
    meta.appendChild(sub);

    wrap.appendChild(meta);
    return wrap;
  }

  function buildReviewRow(movie, review) {
    const el = document.createElement('article');
    el.className = 'profile-review';

    const titleBtn = document.createElement('button');
    titleBtn.type = 'button';
    titleBtn.className = 'profile-review__movie';
    titleBtn.textContent = movie.title;
    titleBtn.addEventListener('click', () => {
      MovieDetail.open(movie.id, titleBtn);
    });
    el.appendChild(titleBtn);

    const meta = document.createElement('div');
    meta.className = 'profile-review__meta';
    const year = document.createElement('span');
    year.textContent = movie.year || '';
    meta.appendChild(year);
    meta.appendChild(UI.renderStars(review.rating));
    const date = document.createElement('span');
    date.textContent = UI.formatDate(review.created_at);
    meta.appendChild(date);
    el.appendChild(meta);

    if (review.comment) {
      const text = document.createElement('p');
      text.className = 'profile-review__text';
      text.textContent = review.comment;
      el.appendChild(text);
    }

    return el;
  }

  function errorBox(msg) {
    const el = document.createElement('div');
    el.className = 'empty';
    el.textContent = msg;
    return el;
  }
})();
