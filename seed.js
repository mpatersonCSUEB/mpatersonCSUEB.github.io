// seed.js
// Idempotent seed script: wipes movies + reviews (FK-safe), then inserts a demo catalog.
// Users are preserved so dev accounts survive reseeds.
//
// When TMDB_API_KEY is set, fetches real posters + metadata from TMDb in parallel.
// Otherwise, falls back to the static title/year/genre/synopsis with null posters.
//
// Usage: node seed.js

require('dotenv').config();
const db = require('./server/db');

const TMDB_BASE = 'https://api.themoviedb.org/3';
const POSTER_BASE = 'https://image.tmdb.org/t/p/w342';

// Hardcoded TMDb IDs keep the seed 100% deterministic across runs. The
// title/year/genre/synopsis values are used as fallbacks when TMDb is
// unreachable or the key is unset.
const SEEDS = [
  {
    tmdb_id: 278,
    title: 'The Shawshank Redemption',
    year: 1994,
    genre: 'Drama',
    synopsis: 'Two imprisoned men bond over years, finding solace and eventual redemption through acts of common decency.'
  },
  {
    tmdb_id: 27205,
    title: 'Inception',
    year: 2010,
    genre: 'Sci-Fi, Thriller, Action',
    synopsis: 'A thief who steals secrets by entering dreams is offered a chance to erase his past if he can plant an idea in a target\'s subconscious.'
  },
  {
    tmdb_id: 155,
    title: 'The Dark Knight',
    year: 2008,
    genre: 'Action, Drama, Crime',
    synopsis: 'Batman faces the Joker, an anarchic criminal mastermind testing Gotham\'s soul and his own limits.'
  },
  {
    tmdb_id: 496243,
    title: 'Parasite',
    year: 2019,
    genre: 'Thriller, Drama',
    synopsis: 'An impoverished family schemes their way into the employment of a wealthy household, with unforeseen consequences.'
  },
  {
    tmdb_id: 129,
    title: 'Spirited Away',
    year: 2001,
    genre: 'Animation, Fantasy',
    synopsis: 'A young girl wanders into a mysterious spirit world and must work in a bathhouse to free her parents.'
  },
  {
    tmdb_id: 419430,
    title: 'Get Out',
    year: 2017,
    genre: 'Horror, Thriller',
    synopsis: 'A young Black man visits his white girlfriend\'s family estate and discovers a disturbing secret.'
  },
  {
    tmdb_id: 120467,
    title: 'The Grand Budapest Hotel',
    year: 2014,
    genre: 'Comedy, Drama',
    synopsis: 'The adventures of a legendary concierge at a famous European hotel and the lobby boy who becomes his protégé.'
  },
  {
    tmdb_id: 76341,
    title: 'Mad Max: Fury Road',
    year: 2015,
    genre: 'Action, Sci-Fi',
    synopsis: 'In a post-apocalyptic wasteland, a drifter and a rebellious warrior flee a tyrant across a desert of chrome and fire.'
  },
  {
    tmdb_id: 329865,
    title: 'Arrival',
    year: 2016,
    genre: 'Sci-Fi, Drama',
    synopsis: 'A linguist is recruited by the military to communicate with alien visitors before tensions lead to war.'
  },
  {
    tmdb_id: 244786,
    title: 'Whiplash',
    year: 2014,
    genre: 'Drama, Music',
    synopsis: 'A promising young drummer enrolls at a cutthroat music conservatory where an abusive instructor pushes him past his breaking point.'
  },
  {
    tmdb_id: 603,
    title: 'The Matrix',
    year: 1999,
    genre: 'Sci-Fi, Action',
    synopsis: 'A hacker discovers reality is a simulation and joins a rebellion against the machines that control it.'
  },
  {
    tmdb_id: 680,
    title: 'Pulp Fiction',
    year: 1994,
    genre: 'Crime, Drama',
    synopsis: 'The lives of two hitmen, a boxer, and a pair of diner bandits intertwine in four tales of violence and redemption.'
  },
  {
    tmdb_id: 354912,
    title: 'Coco',
    year: 2017,
    genre: 'Animation, Family, Musical',
    synopsis: 'A boy who dreams of becoming a musician journeys into the Land of the Dead to uncover his family\'s history.'
  }
];

async function fetchTmdb(seed, key) {
  try {
    const url = `${TMDB_BASE}/movie/${seed.tmdb_id}?api_key=${encodeURIComponent(key)}&language=en-US`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`TMDb ${res.status}`);
    const m = await res.json();
    const yearMatch = /^(\d{4})/.exec(m.release_date || '');
    return {
      tmdb_id: seed.tmdb_id,
      title: m.title || seed.title,
      year: yearMatch ? Number(yearMatch[1]) : seed.year,
      genre: Array.isArray(m.genres) && m.genres.length
        ? m.genres.map((g) => g.name).join(', ')
        : seed.genre,
      synopsis: m.overview || seed.synopsis,
      poster_url: m.poster_path ? POSTER_BASE + m.poster_path : null
    };
  } catch (err) {
    console.warn(`  ! ${seed.title}: fell back to static data (${err.message})`);
    return { ...seed, poster_url: null };
  }
}

async function main() {
  const key = (process.env.TMDB_API_KEY || '').trim();
  let movies;
  if (key) {
    console.log('Fetching movie data from TMDb...');
    movies = await Promise.all(SEEDS.map((s) => fetchTmdb(s, key)));
  } else {
    console.warn('TMDB_API_KEY not set - using static fallback data (posters will be blank).');
    movies = SEEDS.map((s) => ({ ...s, poster_url: null }));
  }

  const tx = db.transaction(() => {
    // Reviews first because of FK; users untouched.
    db.prepare('DELETE FROM reviews').run();
    db.prepare('DELETE FROM movies').run();
    // Reset autoincrement counters so seeded IDs start at 1 consistently.
    db.prepare("DELETE FROM sqlite_sequence WHERE name IN ('movies', 'reviews')").run();

    const insert = db.prepare(
      'INSERT INTO movies (title, year, genre, synopsis, poster_url, tmdb_id) VALUES (?, ?, ?, ?, ?, ?)'
    );
    for (const m of movies) {
      insert.run(m.title, m.year, m.genre, m.synopsis, m.poster_url, m.tmdb_id);
    }
  });
  tx();
  console.log(`Seeded ${movies.length} movies.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
