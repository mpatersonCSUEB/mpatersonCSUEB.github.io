/* movie-detail.js — modal rendering + review form + focus trap.
   Exposes window.MovieDetail.open(id, triggerEl). */
(function () {
  let currentMovie = null;
  let currentRecs = [];
  let lastFocus = null;
  let overlay = null;
  let ratingValueEl = null;
  let ratingStarsEl = null;
  let ratingCountEl = null;
  let reviewsListEl = null;
  let formSection = null;

  async function open(id, triggerEl) {
    lastFocus = triggerEl || document.activeElement;
    try {
      const [data, , recsData] = await Promise.all([
        API.getMovie(id),
        Nav.ensureUser ? Nav.ensureUser() : Promise.resolve(),
        API.getRecommendations(id).catch(() => ({ movies: [] }))
      ]);
      currentMovie = data && data.movie;
      if (!currentMovie) throw new Error('Movie not found');
      currentRecs = (recsData && recsData.movies) || [];
      renderModal();
    } catch (err) {
      Toast.show(err.message || 'Could not load movie', 'error');
    }
  }

  function close() {
    if (!overlay) return;
    overlay.remove();
    overlay = null;
    currentMovie = null;
    document.removeEventListener('keydown', onKeydown, true);
    if (lastFocus && typeof lastFocus.focus === 'function') {
      try { lastFocus.focus(); } catch (_) { /* noop */ }
    }
  }

  function onKeydown(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
      return;
    }
    if (e.key === 'Tab' && overlay) {
      trapFocus(e);
    }
  }

  function trapFocus(e) {
    const focusable = overlay.querySelectorAll(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
    );
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  function renderModal() {
    // Clean up any existing modal
    const mount = document.getElementById('modal-root');
    if (!mount) return;
    mount.innerHTML = '';

    overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'modal-title');
    overlay.tabIndex = -1;

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });

    const modal = document.createElement('div');
    modal.className = 'modal';

    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'modal__close';
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.innerHTML = '\u00D7';
    closeBtn.addEventListener('click', close);
    modal.appendChild(closeBtn);

    // Header
    modal.appendChild(buildHeader());

    // Your review section
    formSection = document.createElement('div');
    formSection.className = 'modal__section';
    const formHeading = document.createElement('h3');
    formHeading.className = 'section-heading';
    formHeading.textContent = 'Your review';
    formSection.appendChild(formHeading);
    formSection.appendChild(buildReviewFormSlot());
    modal.appendChild(formSection);

    // Community reviews
    const commSection = document.createElement('div');
    commSection.className = 'modal__section';
    const commHeading = document.createElement('h3');
    commHeading.className = 'section-heading';
    commHeading.textContent = 'Community reviews';
    commSection.appendChild(commHeading);

    reviewsListEl = document.createElement('div');
    reviewsListEl.className = 'reviews-list';
    commSection.appendChild(reviewsListEl);
    renderReviews();
    modal.appendChild(commSection);

    // "You might also like" — only shown when there are results
    if (currentRecs && currentRecs.length) {
      modal.appendChild(buildRecommendations());
    }

    overlay.appendChild(modal);
    mount.appendChild(overlay);

    document.addEventListener('keydown', onKeydown, true);

    // Focus the close button first so Escape/Tab work immediately.
    setTimeout(() => { closeBtn.focus(); }, 0);
  }

  function buildHeader() {
    const header = document.createElement('div');
    header.className = 'modal__header';

    // Poster
    const posterWrap = document.createElement('div');
    posterWrap.className = 'modal__poster';
    if (currentMovie.poster_url) {
      const img = document.createElement('img');
      img.src = currentMovie.poster_url;
      img.alt = currentMovie.title + ' poster';
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

    // Info
    const info = document.createElement('div');
    info.className = 'modal__info';

    const title = document.createElement('h2');
    title.id = 'modal-title';
    title.className = 'modal__title';
    title.textContent = currentMovie.title;
    info.appendChild(title);

    const meta = document.createElement('div');
    meta.className = 'modal__meta';
    if (currentMovie.year) {
      const y = document.createElement('span');
      y.textContent = currentMovie.year;
      meta.appendChild(y);
    }
    UI.genreList(currentMovie.genre).forEach((g) => meta.appendChild(UI.renderGenreTag(g)));
    info.appendChild(meta);

    const ratingRow = document.createElement('div');
    ratingRow.className = 'modal__rating';
    ratingValueEl = document.createElement('span');
    ratingValueEl.className = 'modal__rating-value';
    ratingStarsEl = UI.renderStars(currentMovie.avg_rating, { large: true });
    ratingCountEl = document.createElement('span');
    ratingCountEl.className = 'modal__rating-count';
    updateRatingHeader();
    ratingRow.appendChild(ratingValueEl);
    ratingRow.appendChild(ratingStarsEl);
    ratingRow.appendChild(ratingCountEl);
    info.appendChild(ratingRow);

    if (currentMovie.synopsis) {
      const s = document.createElement('p');
      s.className = 'modal__synopsis';
      s.textContent = currentMovie.synopsis;
      info.appendChild(s);
    }

    header.appendChild(posterWrap);
    header.appendChild(info);
    return header;
  }

  function updateRatingHeader() {
    const avg = Number(currentMovie.avg_rating) || 0;
    const count = Number(currentMovie.review_count) || 0;
    ratingValueEl.textContent = avg > 0 ? avg.toFixed(1) : '—';
    // Replace stars with fresh element
    const fresh = UI.renderStars(avg, { large: true });
    ratingStarsEl.replaceWith(fresh);
    ratingStarsEl = fresh;
    ratingCountEl.textContent = count + (count === 1 ? ' review' : ' reviews');
  }

  /* ---- Review form (collapsed prompt / expanded / logged-out) --------- */
  function buildReviewFormSlot() {
    const slot = document.createElement('div');
    slot.className = 'review-form';
    renderCollapsed(slot);
    return slot;
  }

  function renderCollapsed(slot) {
    slot.innerHTML = '';
    const user = Nav.getUser();
    if (!user) {
      const cta = document.createElement('div');
      cta.className = 'review-form__login-cta';
      const link = document.createElement('a');
      link.href = 'login.html';
      link.textContent = 'Log in';
      cta.appendChild(link);
      cta.appendChild(document.createTextNode(' to review this film.'));
      slot.appendChild(cta);
      return;
    }

    const prompt = document.createElement('button');
    prompt.type = 'button';
    prompt.className = 'review-form__prompt';
    prompt.innerHTML = '\u270E  Write a review...';
    prompt.addEventListener('click', () => renderExpanded(slot));
    slot.appendChild(prompt);
  }

  function renderExpanded(slot) {
    slot.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'review-form__expanded';

    const starsRow = document.createElement('div');
    starsRow.className = 'review-form__stars-row';
    const label = document.createElement('span');
    label.textContent = 'Your rating:';
    const starCtrl = UI.starInput(0);
    starsRow.appendChild(label);
    starsRow.appendChild(starCtrl.element);
    wrap.appendChild(starsRow);

    const textarea = document.createElement('textarea');
    textarea.className = 'review-form__textarea';
    textarea.placeholder = 'What did you think of this film?';
    textarea.setAttribute('aria-label', 'Your review');
    wrap.appendChild(textarea);

    const actions = document.createElement('div');
    actions.className = 'review-form__actions';

    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'btn btn--ghost';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', () => renderCollapsed(slot));

    const postBtn = document.createElement('button');
    postBtn.type = 'button';
    postBtn.className = 'btn btn--primary';
    postBtn.textContent = 'Post review';
    postBtn.addEventListener('click', async () => {
      const rating = starCtrl.getValue();
      const comment = textarea.value.trim();
      if (rating < 1) { Toast.show('Pick a star rating', 'error'); return; }
      if (!comment) { Toast.show('Write a comment', 'error'); return; }
      postBtn.disabled = true;
      postBtn.textContent = 'Posting...';
      try {
        const data = await API.submitReview(currentMovie.id, { rating, comment });
        const review = data && data.review;
        if (review) {
          currentMovie.reviews = [review].concat(currentMovie.reviews || []);
          // Recompute avg + count locally.
          const count = currentMovie.reviews.length;
          const sum = currentMovie.reviews.reduce((a, r) => a + (Number(r.rating) || 0), 0);
          currentMovie.review_count = count;
          currentMovie.avg_rating = count ? Math.round((sum / count) * 100) / 100 : 0;
          updateRatingHeader();
          renderReviews();
        }
        Toast.show('Review posted');
        renderCollapsed(slot);
      } catch (err) {
        Toast.show(err.message || 'Could not post review', 'error');
        postBtn.disabled = false;
        postBtn.textContent = 'Post review';
      }
    });

    actions.appendChild(cancelBtn);
    actions.appendChild(postBtn);
    wrap.appendChild(actions);

    slot.appendChild(wrap);
    setTimeout(() => { textarea.focus(); }, 0);
  }

  /* ---- Reviews list --------------------------------------------------- */
  function renderReviews() {
    reviewsListEl.innerHTML = '';
    const reviews = currentMovie.reviews || [];
    if (!reviews.length) {
      const empty = document.createElement('div');
      empty.className = 'empty';
      empty.textContent = 'No reviews yet — be the first to share your thoughts!';
      reviewsListEl.appendChild(empty);
      return;
    }
    reviews.forEach((r) => reviewsListEl.appendChild(buildReview(r)));
  }

  function buildReview(review) {
    const el = document.createElement('article');
    el.className = 'review';

    const header = document.createElement('div');
    header.className = 'review__header';

    const username = (review.user && review.user.username) || 'anon';
    header.appendChild(UI.renderAvatar(username));

    const author = document.createElement('span');
    author.className = 'review__author';
    author.textContent = username;
    header.appendChild(author);

    const date = document.createElement('span');
    date.className = 'review__date';
    date.textContent = UI.formatDate(review.created_at);
    header.appendChild(date);

    el.appendChild(header);

    const stars = UI.renderStars(review.rating);
    stars.classList.add('review__stars');
    el.appendChild(stars);

    const text = document.createElement('p');
    text.className = 'review__text';
    text.textContent = review.comment || '';
    el.appendChild(text);

    const actions = document.createElement('div');
    actions.className = 'review__actions';

    const like = document.createElement('button');
    like.type = 'button';
    like.className = 'review__like';
    const likesCount = Number(review.likes) || 0;
    like.innerHTML = '\u25B2 <span class="review__like-count">' + likesCount + '</span>';
    like.setAttribute('aria-label', 'Upvote this review');
    like.addEventListener('click', async () => {
      try {
        const res = await API.likeReview(review.id);
        const count = res && typeof res.likes === 'number' ? res.likes : likesCount + 1;
        like.querySelector('.review__like-count').textContent = count;
        review.likes = count;
      } catch (err) {
        if (err.status === 401) {
          Toast.show('Log in to like reviews', 'error');
        } else {
          Toast.show(err.message || 'Could not like review', 'error');
        }
      }
    });
    actions.appendChild(like);

    const reply = document.createElement('button');
    reply.type = 'button';
    reply.className = 'review__reply';
    reply.textContent = 'Reply';
    reply.addEventListener('click', () => Toast.show('Replies coming soon'));
    actions.appendChild(reply);

    el.appendChild(actions);
    return el;
  }

  /* ---- Recommendations -------------------------------------------------- */
  function buildRecommendations() {
    const section = document.createElement('div');
    section.className = 'modal__section';

    const heading = document.createElement('h3');
    heading.className = 'section-heading';
    heading.textContent = 'You might also like';
    section.appendChild(heading);

    const strip = document.createElement('div');
    strip.className = 'recommendations-strip';

    currentRecs.forEach((m) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'rec-card';
      btn.setAttribute('aria-label', 'Open ' + m.title);

      const posterWrap = document.createElement('div');
      posterWrap.className = 'rec-card__poster';
      if (m.poster_url) {
        const img = document.createElement('img');
        img.src = m.poster_url;
        img.alt = m.title + ' poster';
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
      btn.appendChild(posterWrap);

      const title = document.createElement('div');
      title.className = 'rec-card__title';
      title.textContent = m.title;
      btn.appendChild(title);

      const rating = document.createElement('div');
      rating.className = 'rec-card__rating';
      const avg = Number(m.avg_rating) || 0;
      rating.textContent = avg > 0 ? '\u2605 ' + avg.toFixed(1) : 'No ratings yet';
      btn.appendChild(rating);

      btn.addEventListener('click', () => open(m.id, btn));
      strip.appendChild(btn);
    });

    section.appendChild(strip);
    return section;
  }

  window.MovieDetail = { open, close };
})();
