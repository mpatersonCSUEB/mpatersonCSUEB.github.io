/* ui.js — shared rendering helpers (stars, avatars, genre tags).
   Exposes window.UI. */
(function () {
  const STAR = '\u2605';

  const AVATAR_COLORS = ['purple', 'blue', 'green', 'pink', 'teal'];
  const GENRE_SLUGS = {
    'drama': 'drama',
    'sci-fi': 'sci-fi',
    'scifi': 'sci-fi',
    'science fiction': 'sci-fi',
    'thriller': 'thriller',
    'comedy': 'comedy',
    'romance': 'romance',
    'action': 'action',
    'horror': 'horror',
    'animation': 'animation'
    // any other genre falls back to default purple styling
  };

  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /* renderStars — returns an HTMLElement (span.stars) showing the rounded rating. */
  function renderStars(rating, { large = false } = {}) {
    const filled = Math.max(0, Math.min(5, Math.round(Number(rating) || 0)));
    const wrap = document.createElement('span');
    wrap.className = 'stars' + (large ? ' stars--lg' : '');
    for (let i = 1; i <= 5; i++) {
      const s = document.createElement('span');
      s.className = 'stars__char' + (i <= filled ? ' stars__char--filled' : '');
      s.textContent = STAR;
      wrap.appendChild(s);
    }
    wrap.setAttribute('aria-label', filled + ' of 5 stars');
    return wrap;
  }

  /* starInput — interactive star picker.
     Returns { element, getValue, setValue }. */
  function starInput(initial = 0) {
    let committed = Math.max(0, Math.min(5, Number(initial) || 0));
    const wrap = document.createElement('span');
    wrap.className = 'star-input';
    wrap.setAttribute('role', 'radiogroup');
    wrap.setAttribute('aria-label', 'Your rating');

    const buttons = [];
    for (let i = 1; i <= 5; i++) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'star-input__btn';
      b.textContent = STAR;
      b.dataset.value = String(i);
      b.setAttribute('role', 'radio');
      b.setAttribute('aria-label', i + ' star' + (i === 1 ? '' : 's'));
      b.setAttribute('aria-checked', 'false');
      b.addEventListener('mouseenter', () => paint(i));
      b.addEventListener('focus', () => paint(i));
      b.addEventListener('click', () => { committed = i; paint(committed); updateAria(); });
      b.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
          e.preventDefault();
          const next = Math.max(1, committed - 1);
          committed = next;
          paint(next);
          buttons[next - 1].focus();
          updateAria();
        } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
          e.preventDefault();
          const next = Math.min(5, Math.max(1, committed) + 1);
          committed = next;
          paint(next);
          buttons[next - 1].focus();
          updateAria();
        } else if (e.key >= '1' && e.key <= '5') {
          e.preventDefault();
          const next = Number(e.key);
          committed = next;
          paint(next);
          buttons[next - 1].focus();
          updateAria();
        }
      });
      buttons.push(b);
      wrap.appendChild(b);
    }

    wrap.addEventListener('mouseleave', () => paint(committed));

    function paint(level) {
      buttons.forEach((b, idx) => {
        b.classList.toggle('star-input__btn--filled', idx < level);
      });
    }
    function updateAria() {
      buttons.forEach((b, idx) => {
        b.setAttribute('aria-checked', idx + 1 === committed ? 'true' : 'false');
      });
    }
    paint(committed);
    updateAria();

    return {
      element: wrap,
      getValue: () => committed,
      setValue: (v) => { committed = Math.max(0, Math.min(5, Number(v) || 0)); paint(committed); updateAria(); }
    };
  }

  /* avatarColor — deterministic per-username pick from AVATAR_COLORS. */
  function avatarColor(username) {
    const s = String(username || '');
    let hash = 0;
    for (let i = 0; i < s.length; i++) {
      hash = ((hash << 5) - hash + s.charCodeAt(i)) | 0;
    }
    const idx = Math.abs(hash) % AVATAR_COLORS.length;
    return AVATAR_COLORS[idx];
  }

  function initials(username) {
    const s = String(username || '').trim();
    if (!s) return '?';
    const parts = s.split(/\s+/);
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return s.slice(0, 2).toUpperCase();
  }

  function renderAvatar(username, { large = false } = {}) {
    const el = document.createElement('span');
    el.className = 'avatar avatar--color-' + avatarColor(username) + (large ? ' avatar--lg' : '');
    el.textContent = initials(username);
    el.setAttribute('aria-hidden', 'true');
    return el;
  }

  /* genreList — returns an array of trimmed genre strings from a comma-separated field. */
  function genreList(raw) {
    if (!raw) return [];
    return String(raw).split(',').map(g => g.trim()).filter(Boolean);
  }

  function genreSlug(name) {
    const key = String(name || '').toLowerCase().trim();
    return GENRE_SLUGS[key] || '';
  }

  function renderGenreTag(name) {
    const el = document.createElement('span');
    const slug = genreSlug(name);
    el.className = 'genre-tag' + (slug ? ' genre-tag--' + slug : '');
    el.textContent = name;
    return el;
  }

  /* formatDate — API.md returns SQLite CURRENT_TIMESTAMP strings like "2026-04-20 17:32:04".
     These are UTC per SQLite docs; we render as a short local date. */
  function formatDate(s) {
    if (!s) return '';
    const iso = String(s).replace(' ', 'T') + (String(s).endsWith('Z') ? '' : 'Z');
    const d = new Date(iso);
    if (isNaN(d.getTime())) return String(s);
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }

  window.UI = {
    escapeHtml,
    renderStars,
    starInput,
    renderAvatar,
    avatarColor,
    initials,
    genreList,
    renderGenreTag,
    formatDate
  };
})();
