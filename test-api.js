// test-api.js
// End-to-end smoke test for the Movie Review API.
// Requires the server to already be running on http://localhost:3000.
//
// Usage:
//   node server/index.js      # in one shell
//   node test-api.js          # in another

const BASE = process.env.API_BASE || 'http://localhost:3000';

// --- Tiny cookie jar -------------------------------------------------------
let cookieJar = '';

function captureCookies(res) {
  // Node's fetch exposes set-cookie via getSetCookie() (undici).
  const raw =
    typeof res.headers.getSetCookie === 'function'
      ? res.headers.getSetCookie()
      : res.headers.raw && res.headers.raw()['set-cookie'];
  if (!raw || !raw.length) return;
  const pairs = raw.map((c) => c.split(';')[0]).filter(Boolean);
  // Merge into jar, replacing duplicates by cookie name.
  const jar = new Map();
  for (const p of cookieJar.split('; ').filter(Boolean)) {
    const [name] = p.split('=');
    jar.set(name, p);
  }
  for (const p of pairs) {
    const [name] = p.split('=');
    jar.set(name, p);
  }
  cookieJar = Array.from(jar.values()).join('; ');
}

async function api(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  if (cookieJar) headers.Cookie = cookieJar;
  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  captureCookies(res);
  let json = null;
  const text = await res.text();
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = { _raw: text };
    }
  }
  return { status: res.status, json };
}

// --- Tiny assertion harness ------------------------------------------------
let passed = 0;
let failed = 0;

function check(label, cond, detail) {
  if (cond) {
    console.log(`  PASS  ${label}`);
    passed++;
  } else {
    console.log(`  FAIL  ${label}${detail ? '  ->  ' + detail : ''}`);
    failed++;
  }
}

function section(title) {
  console.log(`\n# ${title}`);
}

// --- Test flow -------------------------------------------------------------
async function main() {
  console.log(`Testing ${BASE}`);

  const suffix = Math.random().toString(36).slice(2, 8);
  const email = `tester_${suffix}@example.com`;
  const username = `tester_${suffix}`;
  const password = 'correcthorsebatterystaple';

  // 1. Register ------------------------------------------------------------
  section('POST /api/auth/register');
  {
    const { status, json } = await api('POST', '/api/auth/register', {
      email,
      username,
      password
    });
    check('status is 201', status === 201, `got ${status} ${JSON.stringify(json)}`);
    check(
      'returns user object',
      json && json.user && json.user.email === email && json.user.username === username,
      JSON.stringify(json)
    );
  }

  // 2. /me returns logged-in user -----------------------------------------
  section('GET /api/auth/me (logged in)');
  {
    const { status, json } = await api('GET', '/api/auth/me');
    check('status is 200', status === 200);
    check('user present', json && json.user && json.user.username === username, JSON.stringify(json));
  }

  // 3. Movies list sorted by year desc ------------------------------------
  section('GET /api/movies?sort=year&order=desc');
  let movies;
  {
    const { status, json } = await api('GET', '/api/movies?sort=year&order=desc');
    check('status is 200', status === 200);
    movies = (json && json.movies) || [];
    check('movies array non-empty', movies.length > 0);
    let descOk = true;
    for (let i = 1; i < movies.length; i++) {
      if (movies[i - 1].year < movies[i].year) {
        descOk = false;
        break;
      }
    }
    check('years sorted descending', descOk);
  }

  // 4. Filter by genre -----------------------------------------------------
  section('GET /api/movies?genre=Drama');
  {
    const { status, json } = await api('GET', '/api/movies?genre=Drama');
    check('status is 200', status === 200);
    const list = (json && json.movies) || [];
    check('every movie has Drama in genre', list.length > 0 && list.every((m) => (m.genre || '').includes('Drama')));
  }

  // 5. Movie detail --------------------------------------------------------
  section('GET /api/movies/1');
  {
    const { status, json } = await api('GET', '/api/movies/1');
    check('status is 200', status === 200);
    check(
      'has reviews array and avg_rating',
      json && json.movie && Array.isArray(json.movie.reviews) && 'avg_rating' in json.movie,
      JSON.stringify(json).slice(0, 200)
    );
  }

  // 6. Post review ---------------------------------------------------------
  section('POST /api/movies/1/reviews');
  let newReviewId;
  {
    const { status, json } = await api('POST', '/api/movies/1/reviews', {
      rating: 5,
      comment: 'Test review from test-api.js'
    });
    check('status is 201', status === 201, JSON.stringify(json));
    check('returns review with id', json && json.review && typeof json.review.id === 'number');
    newReviewId = json && json.review && json.review.id;
  }

  // 7. Like the review -----------------------------------------------------
  section('POST /api/reviews/:id/like');
  if (newReviewId) {
    const { status, json } = await api('POST', `/api/reviews/${newReviewId}/like`);
    check('status is 200', status === 200);
    check('likes incremented to 1', json && json.likes === 1, JSON.stringify(json));
  } else {
    check('skipped (no review id)', false, 'no review id from previous step');
  }

  // 8. Validation: bad review rejected ------------------------------------
  section('POST /api/movies/1/reviews (invalid payload)');
  {
    const { status, json } = await api('POST', '/api/movies/1/reviews', {
      rating: 9,
      comment: ''
    });
    check('status is 400', status === 400, JSON.stringify(json));
    check('error message present', json && typeof json.error === 'string');
  }

  // 9. Logout --------------------------------------------------------------
  section('POST /api/auth/logout');
  {
    const { status, json } = await api('POST', '/api/auth/logout');
    check('status is 200', status === 200);
    check('returns { ok: true }', json && json.ok === true);
  }

  // 10. Protected route now rejects ---------------------------------------
  section('POST /api/movies/1/reviews (after logout)');
  {
    const { status, json } = await api('POST', '/api/movies/1/reviews', {
      rating: 5,
      comment: 'should be rejected'
    });
    check('status is 401', status === 401, JSON.stringify(json));
  }

  // 11. /me returns null after logout -------------------------------------
  section('GET /api/auth/me (logged out)');
  {
    const { status, json } = await api('GET', '/api/auth/me');
    check('status is 200', status === 200);
    check('user is null', json && json.user === null, JSON.stringify(json));
  }

  // --- Summary ----------------------------------------------------------
  console.log(`\n---\n${passed} passed, ${failed} failed.`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error('Test runner crashed:', err);
  process.exit(2);
});
