# Multi-Agent Coordination Plan

## Project: Movie Review Website

This document defines how three Claude Code agent sessions coordinate to build the project. Each agent owns a clear slice of the codebase, builds sequentially, and communicates through shared contracts checked into the repo.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│                   Browser                       │
│  HTML / CSS / Vanilla JS                        │
│  Pages: Home, Movie Detail, Login, Profile      │
│  (Agent 2 — Frontend)                           │
└─────────────┬───────────────────────────────────┘
              │  fetch() → JSON
              ▼
┌─────────────────────────────────────────────────┐
│              Express.js Server                  │
│  Routes: /api/movies, /api/auth, /api/reviews   │
│  Middleware: session auth, input validation      │
│  (Agent 1 — Backend)                            │
└─────────────┬───────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────┐
│          SQLite (better-sqlite3)                │
│  Tables: movies, users, reviews                 │
│  File: data/moviereviews.db                     │
└─────────────────────────────────────────────────┘

  Agent 3 (Full-Stack Integrator) works across all layers.
```

---

## Agent Responsibilities

### Agent 1 — Backend

**Owns:** `server/`, `data/`, `API.md`, `seed.js`

| Responsibility | Details |
|---|---|
| Database schema | Create tables with foreign keys, constraints, indexes |
| Seed data | Populate 10–15 movies across genres for demo purposes |
| REST API routes | All endpoints from PRD §6 |
| Auth middleware | express-session + bcrypt registration/login/logout |
| Input validation | Reject bad ratings, empty reviews, duplicate emails |
| API contract | Generate `API.md` documenting every route's request/response shape |
| Self-testing | Write a `test-api.js` script that exercises each endpoint |

**Does NOT touch:** Any HTML, CSS, or client-side JS.

**Outputs before handoff:**
- Working API server (`npm run server` starts it)
- `API.md` with exact route specs (see template below)
- `seed.js` that populates the DB with demo data
- Committed and pushed to repo

---

### Agent 2 — Frontend

**Owns:** `public/` (all HTML, CSS, client-side JS)

| Responsibility | Details |
|---|---|
| Page structure | Home (movie grid), Movie Detail, Login/Register, Profile |
| Movie list | Card grid with poster, title, year, average rating |
| Movie detail | Full info, review list, review submission form |
| Star rating UI | Clickable star input + average star display |
| Sort & filter | Dropdowns/controls for rating, year, genre |
| Responsive layout | Mobile-friendly with CSS (no framework required) |
| API integration | All data fetched from backend via `fetch()` calls |

**Does NOT touch:** Any server-side code, database queries, or Express routes.

**Inputs it reads:**
- `API.md` — the source of truth for all fetch calls
- `DESIGN.md` — the source of truth for all visual decisions (colors, typography, components, spacing)
- The running backend on `localhost:3000` for manual testing

**Key design decisions (see DESIGN.md for full specs):**
- Dark theme with deep navy-purple backgrounds
- Purple accent color (`#8B5CF6`)
- Movie detail opens as a modal overlay, not a separate page
- Review form uses inline expansion (collapsed dashed prompt → expanded form)
- Brand name: "CineCritic" (cine in white, critic in purple)

**Outputs before handoff:**
- All pages functional against the live API
- Clean separation: no inline API URLs scattered around (use a config constant like `const API_BASE = '/api'`)
- Committed and pushed to repo

---

### Agent 3 — Full-Stack Integrator

**Owns:** Cross-cutting concerns, integration bugs, advanced features

| Responsibility | Details |
|---|---|
| Auth flow wiring | Ensure login state reflects in UI (show/hide elements, protect forms) |
| Session handling | Frontend reads session status from a `/api/auth/me` endpoint |
| TMDb integration | Backend route to proxy TMDb search; frontend search UI |
| Recommendation engine | SQL query on backend + suggestion card UI on frontend |
| Bug fixes | Resolve mismatches between frontend expectations and backend responses |
| Error handling | Unified error display (toast/banner) for API failures |
| Polish | Loading states, empty states, edge cases |
| README | Final setup instructions (`npm install && npm start`) |

**Inputs it reads:**
- Full codebase from Agents 1 and 2
- `API.md`
- `PRD.md` or the original PRD document for spec reference

---

## Shared Contracts

### File Structure

```
movie-review-site/
├── server/
│   ├── index.js          # Express app entry point
│   ├── routes/
│   │   ├── movies.js
│   │   ├── reviews.js
│   │   └── auth.js
│   ├── middleware/
│   │   └── auth.js       # requireAuth middleware
│   └── db.js             # SQLite connection + schema init
├── public/
│   ├── index.html        # Home / movie list + modal container
│   ├── login.html        # Login / register
│   ├── profile.html      # User profile
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── api.js         # Fetch wrapper, API_BASE config
│       ├── movies.js      # Movie grid + sort/filter logic
│       ├── movie-detail.js # Modal rendering + review form
│       ├── auth.js        # Login/register UI logic
│       ├── nav.js         # Shared nav bar injection
│       └── profile.js
├── data/
│   └── moviereviews.db   # SQLite file (gitignored)
├── seed.js               # Database seeding script
├── API.md                # Route contract (Agent 1 generates)
├── DESIGN.md             # Visual design system (colors, components, specs)
├── AGENTS.md             # This file
├── package.json
└── README.md
```

### API.md Template

Agent 1 must generate `API.md` following this format so Agent 2 can build against it reliably:

```markdown
## GET /api/movies

Returns all movies, with optional query params for filtering/sorting.

**Query params (all optional):**
- `genre` — filter by genre (exact match)
- `sort` — one of: `rating`, `year`, `title` (default: `title`)
- `order` — `asc` or `desc` (default: `asc`)

**Response 200:**
​```json
{
  "movies": [
    {
      "id": 1,
      "title": "The Shawshank Redemption",
      "year": 1994,
      "genre": "Drama",
      "poster_url": "/posters/shawshank.jpg",
      "avg_rating": 4.7,
      "review_count": 12
    }
  ]
}
​```

**Response 500:**
​```json
{ "error": "Internal server error" }
​```
```

Every route should include: method, path, query/body params, auth requirement, and example response shapes for success and error cases.

### Conventions

- **Port:** Backend runs on `localhost:3000`
- **Static files:** Express serves `public/` as static root
- **API prefix:** All data routes start with `/api/`
- **Auth check:** `GET /api/auth/me` returns `{ user: { id, username, email } }` or `{ user: null }`
- **Error shape:** All errors return `{ "error": "message" }`
- **Dates:** ISO 8601 strings from SQLite's `datetime('now')`
- **IDs:** Integer, auto-increment

---

## Execution Order

```
Step 1: Agent 1 (Backend)
   └── Builds API, schema, seed data, auth
   └── Generates API.md
   └── Commits everything

Step 2: Agent 2 (Frontend)
   └── Reads API.md
   └── Builds all pages against live API
   └── Commits everything

Step 3: Agent 3 (Full-Stack Integrator)
   └── Reads full codebase
   └── Wires auth flow end-to-end
   └── Adds TMDb + recommendations
   └── Fixes integration bugs
   └── Writes final README
   └── Commits everything
```

**Do not run agents in parallel.** Each agent commits before the next starts.

---

## Context Management Tips

- Each agent session starts by reading this file and the PRD
- Agent 1 only needs `AGENTS.md` + PRD §2–6 (stack, requirements, data model, endpoints)
- Agent 2 only needs `AGENTS.md` + `API.md` + `DESIGN.md` + PRD §7 (page structure)
- Agent 3 needs everything, but by this point the code is the primary reference
- If an agent's context gets long, it can checkpoint by committing and summarizing what's done vs. remaining in a `STATUS.md`
