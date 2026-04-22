# Movie Review API

Base URL: `http://localhost:3000`
All data routes are prefixed with `/api/`. Requests and responses are JSON.

**Conventions**

- **Auth** — Session-based via `express-session`. The server sets an HTTP-only `connect.sid` cookie on register/login. The client must send this cookie back on every subsequent request. When using `fetch()` from the browser, pass `credentials: 'include'` (or `'same-origin'` if served from the same host).
- **Error shape** — All errors return `{ "error": "<human-readable message>" }`.
- **Dates** — ISO 8601 strings from SQLite's `CURRENT_TIMESTAMP` (e.g., `"2026-04-20 17:32:04"`).
- **IDs** — Auto-increment integers.
- **Ratings** — Integers from 1 to 5 inclusive. `avg_rating` is a float rounded to 2 decimals (or `0` when no reviews exist).

---

## POST /api/auth/register

Create a new user account. On success, the user is logged in immediately (a session cookie is set).

**Auth:** No

**Body:**
- `email` (string, required) — must be a valid email format
- `username` (string, required) — at least 2 characters
- `password` (string, required) — at least 6 characters

**Example request:**
```json
{
  "email": "alice@example.com",
  "username": "alice",
  "password": "correcthorsebattery"
}
```

**Response 201:**
```json
{
  "user": {
    "id": 1,
    "username": "alice",
    "email": "alice@example.com"
  }
}
```

**Response 400:**
```json
{ "error": "Password must be at least 6 characters" }
```

**Response 409:**
```json
{ "error": "Email or username already in use" }
```

---

## POST /api/auth/login

Log in an existing user. On success, a session cookie is set.

**Auth:** No

**Body:**
- `email` (string, required)
- `password` (string, required)

**Example request:**
```json
{
  "email": "alice@example.com",
  "password": "correcthorsebattery"
}
```

**Response 200:**
```json
{
  "user": {
    "id": 1,
    "username": "alice",
    "email": "alice@example.com"
  }
}
```

**Response 401:**
```json
{ "error": "Invalid credentials" }
```

---

## GET /api/auth/me

Return the currently logged-in user, or `null` when no session is active. Always returns `200`.

**Auth:** No (but the response depends on session state)

**Response 200 (logged in):**
```json
{
  "user": {
    "id": 1,
    "username": "alice",
    "email": "alice@example.com"
  }
}
```

**Response 200 (logged out):**
```json
{ "user": null }
```

---

## POST /api/auth/logout

Destroy the current session and clear the cookie. Idempotent — safe to call when not logged in.

**Auth:** No

**Response 200:**
```json
{ "ok": true }
```

**Response 500:**
```json
{ "error": "Could not log out" }
```

---

## GET /api/movies

Return all movies with aggregated `avg_rating` and `review_count`. Supports optional filter/sort.

**Auth:** No

**Query params (all optional):**
- `genre` — substring match against the comma-separated `genre` field (e.g. `?genre=Drama` matches `"Action, Drama, Crime"`)
- `sort` — one of: `rating`, `year`, `title`  (default: `title`)
- `order` — `asc` or `desc`  (default: `asc`)

**Example:** `GET /api/movies?genre=Drama&sort=rating&order=desc`

**Response 200:**
```json
{
  "movies": [
    {
      "id": 1,
      "title": "The Shawshank Redemption",
      "year": 1994,
      "genre": "Drama",
      "synopsis": "Two imprisoned men bond over years...",
      "poster_url": "/posters/shawshank.jpg",
      "tmdb_id": null,
      "avg_rating": 4.7,
      "review_count": 12
    }
  ]
}
```

**Response 400:**
```json
{ "error": "Invalid sort (use rating, year, or title)" }
```

**Response 500:**
```json
{ "error": "Internal server error" }
```

---

## GET /api/movies/:id

Return a single movie with its full review list (newest first). Each review includes the author's `id` and `username`.

**Auth:** No

**Path params:**
- `id` (integer) — movie id

**Example:** `GET /api/movies/1`

**Response 200:**
```json
{
  "movie": {
    "id": 1,
    "title": "The Shawshank Redemption",
    "year": 1994,
    "genre": "Drama",
    "synopsis": "Two imprisoned men bond over years...",
    "poster_url": "/posters/shawshank.jpg",
    "tmdb_id": null,
    "avg_rating": 4.7,
    "review_count": 2,
    "reviews": [
      {
        "id": 14,
        "rating": 5,
        "comment": "A masterpiece.",
        "likes": 3,
        "created_at": "2026-04-20 17:32:04",
        "user": { "id": 1, "username": "alice" }
      },
      {
        "id": 9,
        "rating": 4,
        "comment": "Beautifully paced.",
        "likes": 0,
        "created_at": "2026-04-19 22:10:00",
        "user": { "id": 2, "username": "bob" }
      }
    ]
  }
}
```

**Response 400:**
```json
{ "error": "Invalid movie id" }
```

**Response 404:**
```json
{ "error": "Movie not found" }
```

---

## POST /api/movies/:id/reviews

Submit a review for a movie. Requires an authenticated session.

**Auth:** Yes

**Path params:**
- `id` (integer) — movie id

**Body:**
- `rating` (integer, required) — 1 to 5 inclusive
- `comment` (string, required) — non-empty after trimming

**Example request:**
```json
{ "rating": 5, "comment": "Loved every minute of it." }
```

**Response 201:**
```json
{
  "review": {
    "id": 14,
    "movie_id": 1,
    "rating": 5,
    "comment": "Loved every minute of it.",
    "likes": 0,
    "created_at": "2026-04-20 17:32:04",
    "user": { "id": 1, "username": "alice" }
  }
}
```

**Response 400:**
```json
{ "error": "Rating must be an integer between 1 and 5" }
```

**Response 401:**
```json
{ "error": "Authentication required" }
```

**Response 404:**
```json
{ "error": "Movie not found" }
```

---

## POST /api/reviews/:id/like

Increment a review's like count by 1. Requires an authenticated session.

> Note: the current implementation does not deduplicate likes per user — each call increments the counter. A future enhancement could add a `review_likes` join table to enforce one-like-per-user.

**Auth:** Yes

**Path params:**
- `id` (integer) — review id

**Example:** `POST /api/reviews/14/like`

**Response 200:**
```json
{ "id": 14, "likes": 4 }
```

**Response 400:**
```json
{ "error": "Invalid review id" }
```

**Response 401:**
```json
{ "error": "Authentication required" }
```

**Response 404:**
```json
{ "error": "Review not found" }
```

---

---

## GET /api/movies/:id/recommend

Return up to 5 movies that share at least one genre with the given movie, ranked by average community rating (highest first). If the caller is authenticated, movies they have already reviewed are excluded.

**Auth:** No (but session is used to personalize results when available)

**Path params:**
- `id` (integer) — movie id

**Example:** `GET /api/movies/1/recommend`

**Response 200:**
```json
{
  "movies": [
    {
      "id": 9,
      "title": "Arrival",
      "year": 2016,
      "genre": "Sci-Fi, Drama",
      "poster_url": "/posters/arrival.jpg",
      "avg_rating": 4.5,
      "review_count": 3
    }
  ]
}
```

**Response 400:**
```json
{ "error": "Invalid movie id" }
```

**Response 404:**
```json
{ "error": "Movie not found" }
```

---

## GET /api/tmdb/search?q=...

Search The Movie Database for movies by title. Annotates each result with whether the movie already exists in the local catalog. Returns `503` when `TMDB_API_KEY` is not set in the environment.

**Auth:** No

**Query params:**
- `q` (string, required) — search query, max 100 characters

**Example:** `GET /api/tmdb/search?q=inception`

**Response 200:**
```json
{
  "results": [
    {
      "tmdb_id": 27205,
      "title": "Inception",
      "year": 2010,
      "poster_url": "https://image.tmdb.org/t/p/w342/...",
      "overview": "Cobb, a skilled thief...",
      "already_added": false,
      "local_id": null
    }
  ]
}
```

**Response 400:**
```json
{ "error": "Query parameter \"q\" is required" }
```

**Response 503 (TMDB_API_KEY not configured):**
```json
{ "error": "TMDb integration is not configured" }
```

---

## POST /api/tmdb/import/:tmdbId

Fetch movie details from TMDb and insert them into the local catalog. Requires authentication.

**Auth:** Yes

**Path params:**
- `tmdbId` (integer) — the TMDb movie ID from a search result

**Example:** `POST /api/tmdb/import/27205`

**Response 201:**
```json
{
  "movie": {
    "id": 14,
    "title": "Inception",
    "year": 2010,
    "genre": "Action, Science Fiction, Adventure",
    "synopsis": "Cobb, a skilled thief...",
    "poster_url": "https://image.tmdb.org/t/p/w342/...",
    "tmdb_id": 27205
  }
}
```

**Response 401:**
```json
{ "error": "Authentication required" }
```

**Response 404:**
```json
{ "error": "Movie not found on TMDb" }
```

**Response 409 (already imported):**
```json
{ "error": "Movie already in catalog", "movie": { ... } }
```

**Response 503 (TMDB_API_KEY not configured):**
```json
{ "error": "TMDb integration is not configured" }
```

---

## Error reference

| Status | Meaning | Example body |
|---|---|---|
| 400 | Invalid input (missing/badly formatted fields, bad query params) | `{ "error": "Comment is required" }` |
| 401 | Not authenticated, or bad login credentials | `{ "error": "Authentication required" }` |
| 404 | Resource not found | `{ "error": "Movie not found" }` |
| 409 | Conflict (e.g. duplicate email/username at registration) | `{ "error": "Email or username already in use" }` |
| 500 | Unhandled server error | `{ "error": "Internal server error" }` |
| 503 | External service not configured (TMDb key missing) | `{ "error": "TMDb integration is not configured" }` |
