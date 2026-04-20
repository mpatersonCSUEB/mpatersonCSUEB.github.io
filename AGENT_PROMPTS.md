# Claude Code Agent Prompts

Copy-paste these prompts to kick off each agent session in Claude Code.
Run them in order: Backend → Frontend → Integrator.

---

## Agent 1 — Backend

```
Read AGENTS.md and the PRD document in this repo. You are Agent 1 (Backend).

Your job is to build the complete backend for a Movie Review Website using
Node.js, Express, and SQLite (better-sqlite3). Do NOT create any HTML, CSS,
or client-side JavaScript.

Here's your task list:

1. Initialize the project: `npm init`, install express, better-sqlite3,
   express-session, bcrypt, and cors.

2. Create the SQLite schema in server/db.js:
   - movies (id, title, year, genre, synopsis, poster_url, tmdb_id)
   - users (id, email, username, password_hash, created_at)
   - reviews (id, movie_id FK, user_id FK, rating CHECK 1-5, comment, likes DEFAULT 0, created_at)
   - Enable foreign keys with PRAGMA foreign_keys = ON

3. Create seed.js that populates 12-15 movies across at least 5 genres
   with realistic data (titles, years, synopses). Run it with `node seed.js`.

4. Implement all API routes per the PRD:
   - GET  /api/movies (with ?genre, ?sort, ?order query params)
   - GET  /api/movies/:id (include reviews + avg rating)
   - POST /api/movies/:id/reviews (auth required, validate rating 1-5 + non-empty comment)
   - POST /api/reviews/:id/like (auth required)
   - POST /api/auth/register (hash password, validate unique email)
   - POST /api/auth/login (compare hash, create session)
   - POST /api/auth/logout (destroy session)
   - GET  /api/auth/me (return current user or null)

5. Create requireAuth middleware in server/middleware/auth.js.

6. Configure Express to serve the public/ directory as static files.

7. All errors return { "error": "message" } format.

8. Write a test-api.js script that:
   - Registers a test user
   - Logs in
   - Submits a review
   - Likes a review
   - Fetches movies with sort/filter
   - Logs out
   - Verifies protected routes reject unauthenticated requests
   Run it and fix any failures.

9. Generate API.md documenting every route with: method, path, params,
   auth requirement, and example request/response JSON. Follow the template
   in AGENTS.md exactly.

10. Commit everything to the repo when done.

Work through these steps one at a time. Test as you go. The frontend agent
will build entirely against your API.md, so accuracy there is critical.
```

---

## Agent 2 — Frontend

```
Read AGENTS.md, API.md, and DESIGN.md in this repo. You are Agent 2 (Frontend).

DESIGN.md is your visual source of truth. Every color, font size, spacing
value, and component pattern is defined there. Follow it precisely — do not
invent your own color palette or component styles.

Your job is to build the complete frontend for a Movie Review Website using
vanilla HTML, CSS, and JavaScript. Do NOT modify any files in server/.
All data comes from fetch() calls to the API documented in API.md.

The backend is already running on localhost:3000. Start it with `npm run server`
if needed, then build the frontend.

Here's your task list:

1. Create public/css/style.css using the DESIGN.md specs:
   - Define all CSS custom properties (--bg-deep, --bg-surface, --bg-card,
     --purple-accent, --text-primary, etc.) from the Color Palette section
   - Dark theme throughout: page background is --bg-deep (#0D0B1A)
   - Brand name: "cine" in white + "critic" in purple accent
   - Genre tags use per-genre colors with translucent backgrounds
   - Stars use Unicode ★ (U+2605) with --star-filled and --star-empty colors
   - Responsive grid: 4 cols desktop, 3 tablet, 2 mobile
   - Skeleton loading animations with the pulse keyframe from DESIGN.md
   - Toast notification styles per DESIGN.md

2. Create public/js/api.js — a thin fetch wrapper module:
   - const API_BASE = '/api'
   - Helper functions: getMovies(), getMovie(id), submitReview(), login(),
     register(), logout(), getCurrentUser(), likeReview()
   - All functions handle errors and return parsed JSON
   - Include credentials: 'same-origin' on all fetch calls for session cookies

3. Build the Home page (public/index.html + public/js/movies.js):
   - Sticky nav bar: logo left, nav links + avatar right (per DESIGN.md nav spec)
   - Search bar + filter/sort pill buttons above the grid
   - Movie card grid: poster with rating badge overlay, title, year, genre tag
   - Cards have hover lift effect (translateY -3px, purple border glow)
   - Clicking a card opens the movie detail MODAL (not a separate page)
   - Show skeleton card placeholders while loading

4. Build the Movie Detail modal (public/js/movie-detail.js):
   - Overlay: rgba(0,0,0,0.7) covering viewport, scrollable
   - Modal: --bg-modal background, max-width 620px, border-radius 14px
   - Header: poster (160px) + info column (title, meta, big rating, synopsis)
   - Review form section with inline expansion:
     * Default: dashed-border "Write a review..." prompt
     * Expanded: clickable star input + textarea + Cancel/Post buttons
     * Form hidden entirely if not logged in (show "Log in to review" link)
   - Community reviews list: avatar + username + date + stars + text + upvote
   - Close on X button or clicking overlay background
   - Close on Escape key, trap focus while open

5. Build Login/Register page (public/login.html + public/js/auth.js):
   - Centered card (max-width 400px) on --bg-deep background
   - Tab toggle: "Log in" / "Sign up" with purple underline on active tab
   - Login: email + password fields
   - Register: username + email + password + confirm password
   - Full-width primary submit button
   - Error messages in red (#F87171), 12px
   - Redirect to home on success

6. Build User Profile page (public/profile.html + public/js/profile.js):
   - Large avatar (44px) with username and member-since date
   - List of user's submitted reviews with movie title and rating
   - Redirect to login if not authenticated

7. Add the nav bar as a shared component (inject via JS on each page):
   - Logo "cine|critic" linking to home
   - Links: Home, Discover, My Reviews (logged in) or Log In (logged out)
   - User avatar circle (28px, colored bg, white initials) when logged in
   - Check auth status on page load via GET /api/auth/me

8. Implement toast notifications:
   - Show on: review posted, logged in, logged out, errors
   - Style per DESIGN.md: --bg-card, purple left border, auto-dismiss 3s

9. Test every page against the live API. Verify:
   - Movies load and display correctly with skeleton loading
   - Sorting and filtering work
   - Card click opens modal with correct movie data
   - Review form expands/collapses, star input works
   - Review submission works when logged in, form hidden when logged out
   - Login/register/logout flow works end-to-end
   - Like button increments count
   - Modal closes on X, overlay click, and Escape key
   - Toast notifications appear for key actions

10. Commit everything to the repo when done.

The design is dark, cinematic, and modern. Reference DESIGN.md for every
visual decision. When in doubt, favor subtlety — translucent borders,
muted text, minimal animation.
```

---

## Agent 3 — Full-Stack Integrator

```
Read AGENTS.md, API.md, and browse the full codebase in this repo.
You are Agent 3 (Full-Stack Integrator).

The backend (server/) and frontend (public/) have been built by two prior
agents. Your job is to integrate them, add advanced features, fix bugs,
and polish the project for submission.

Start by running the app (`npm run server`) and manually testing each page.
Note any bugs or mismatches before writing code.

Here's your task list:

1. Integration audit — test and fix:
   - Auth state: does the nav bar update after login/logout without a full page refresh?
   - Session persistence: does refreshing a page maintain login state?
   - Review submission: does the review list update immediately after posting?
   - Error handling: do API errors display user-friendly messages (not raw JSON)?
   - Edge cases: empty movie list, no reviews yet, long review text, special characters

2. Add GET /api/auth/me endpoint if not already present. Ensure the frontend
   calls it on every page load to set auth-dependent UI state.

3. TMDb integration (Advanced tier):
   - Sign up for a free TMDb API key at https://www.themoviedb.org/settings/api
     (for now, use a placeholder key and document where to set it in .env)
   - Add a .env file with TMDB_API_KEY and use dotenv to load it
   - Backend: GET /api/tmdb/search?q=... — proxy search to TMDb, return results
   - Backend: POST /api/tmdb/import/:tmdbId — fetch movie details from TMDb
     and insert into local database
   - Frontend: add a search bar (on home page or separate page) that searches
     TMDb and shows results with an "Add to catalog" button
   - Handle the case where a movie is already in the local DB (show "Already added")

4. Recommendation engine (Advanced tier):
   - Backend: GET /api/movies/:id/recommend
     Query logic: find movies sharing genres with the given movie, exclude movies
     the current user has already reviewed, rank by average rating, return top 5
   - Frontend: add a "You might also like" section on the movie detail page
     showing recommendation cards

5. Polish and UX:
   - Add loading spinners or skeleton states for async content
   - Add empty states ("No reviews yet — be the first!")
   - Add a toast or inline notification for successful actions (review posted, etc.)
   - Ensure the star rating input has hover/active states
   - Check mobile responsiveness on narrow viewport

6. Write the final README.md:
   - Project description (1–2 sentences)
   - Tech stack list
   - Setup instructions:
     1. Clone repo
     2. npm install
     3. Copy .env.example to .env and add TMDb key (optional)
     4. node seed.js
     5. npm start
     6. Open localhost:3000
   - Feature list organized by tier (Basic / Enhanced / Advanced)
   - Screenshots section (placeholder — student can add later)

7. Final checks:
   - Run the test-api.js script from Agent 1 — all tests pass
   - No console errors in the browser
   - No hardcoded localhost URLs in frontend code (use relative paths)
   - .gitignore includes: node_modules/, data/*.db, .env
   - package.json has correct "start" and "server" scripts

8. Commit everything. Write a clear commit message summarizing integration work.

You have the most context of any agent — use it to make the whole project
feel cohesive rather than stitched together.
```

---

## Quick Reference: Running the Agents

```bash
# 1. Create the repo and add coordination files
mkdir movie-review-site && cd movie-review-site
git init
# Copy AGENTS.md and the PRD into the repo
git add -A && git commit -m "Initial setup: AGENTS.md + PRD"

# 2. Start Agent 1 (Backend) in Claude Code
#    Paste the Agent 1 prompt above
#    When done, verify: npm run server starts, API.md exists

# 3. Start Agent 2 (Frontend) in a new Claude Code session
#    Paste the Agent 2 prompt above
#    When done, verify: pages load at localhost:3000

# 4. Start Agent 3 (Integrator) in a new Claude Code session
#    Paste the Agent 3 prompt above
#    When done: full project ready for submission
```
