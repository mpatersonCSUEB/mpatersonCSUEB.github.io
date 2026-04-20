// seed.js
// Idempotent seed script: wipes movies + reviews (FK-safe), then inserts a demo catalog.
// Users are preserved so dev accounts survive reseeds.
//
// Usage: node seed.js

require('dotenv').config();
const db = require('./server/db');

const MOVIES = [
  {
    title: 'The Shawshank Redemption',
    year: 1994,
    genre: 'Drama',
    synopsis: 'Two imprisoned men bond over years, finding solace and eventual redemption through acts of common decency.',
    poster_url: '/posters/shawshank.jpg'
  },
  {
    title: 'Inception',
    year: 2010,
    genre: 'Sci-Fi, Thriller, Action',
    synopsis: 'A thief who steals secrets by entering dreams is offered a chance to erase his past if he can plant an idea in a target\'s subconscious.',
    poster_url: '/posters/inception.jpg'
  },
  {
    title: 'The Dark Knight',
    year: 2008,
    genre: 'Action, Drama, Crime',
    synopsis: 'Batman faces the Joker, an anarchic criminal mastermind testing Gotham\'s soul and his own limits.',
    poster_url: '/posters/dark-knight.jpg'
  },
  {
    title: 'Parasite',
    year: 2019,
    genre: 'Thriller, Drama',
    synopsis: 'An impoverished family schemes their way into the employment of a wealthy household, with unforeseen consequences.',
    poster_url: '/posters/parasite.jpg'
  },
  {
    title: 'Spirited Away',
    year: 2001,
    genre: 'Animation, Fantasy',
    synopsis: 'A young girl wanders into a mysterious spirit world and must work in a bathhouse to free her parents.',
    poster_url: '/posters/spirited-away.jpg'
  },
  {
    title: 'Get Out',
    year: 2017,
    genre: 'Horror, Thriller',
    synopsis: 'A young Black man visits his white girlfriend\'s family estate and discovers a disturbing secret.',
    poster_url: '/posters/get-out.jpg'
  },
  {
    title: 'The Grand Budapest Hotel',
    year: 2014,
    genre: 'Comedy, Drama',
    synopsis: 'The adventures of a legendary concierge at a famous European hotel and the lobby boy who becomes his protégé.',
    poster_url: '/posters/grand-budapest.jpg'
  },
  {
    title: 'Mad Max: Fury Road',
    year: 2015,
    genre: 'Action, Sci-Fi',
    synopsis: 'In a post-apocalyptic wasteland, a drifter and a rebellious warrior flee a tyrant across a desert of chrome and fire.',
    poster_url: '/posters/fury-road.jpg'
  },
  {
    title: 'Arrival',
    year: 2016,
    genre: 'Sci-Fi, Drama',
    synopsis: 'A linguist is recruited by the military to communicate with alien visitors before tensions lead to war.',
    poster_url: '/posters/arrival.jpg'
  },
  {
    title: 'Whiplash',
    year: 2014,
    genre: 'Drama, Music',
    synopsis: 'A promising young drummer enrolls at a cutthroat music conservatory where an abusive instructor pushes him past his breaking point.',
    poster_url: '/posters/whiplash.jpg'
  },
  {
    title: 'The Matrix',
    year: 1999,
    genre: 'Sci-Fi, Action',
    synopsis: 'A hacker discovers reality is a simulation and joins a rebellion against the machines that control it.',
    poster_url: '/posters/matrix.jpg'
  },
  {
    title: 'Pulp Fiction',
    year: 1994,
    genre: 'Crime, Drama',
    synopsis: 'The lives of two hitmen, a boxer, and a pair of diner bandits intertwine in four tales of violence and redemption.',
    poster_url: '/posters/pulp-fiction.jpg'
  },
  {
    title: 'Coco',
    year: 2017,
    genre: 'Animation, Family, Musical',
    synopsis: 'A boy who dreams of becoming a musician journeys into the Land of the Dead to uncover his family\'s history.',
    poster_url: '/posters/coco.jpg'
  }
];

function main() {
  const tx = db.transaction(() => {
    // Reviews first because of FK; users untouched.
    db.prepare('DELETE FROM reviews').run();
    db.prepare('DELETE FROM movies').run();
    // Reset autoincrement counters so seeded IDs start at 1 consistently.
    db.prepare("DELETE FROM sqlite_sequence WHERE name IN ('movies', 'reviews')").run();

    const insert = db.prepare(
      'INSERT INTO movies (title, year, genre, synopsis, poster_url) VALUES (?, ?, ?, ?, ?)'
    );
    for (const m of MOVIES) {
      insert.run(m.title, m.year, m.genre, m.synopsis, m.poster_url);
    }
  });
  tx();
  console.log(`Seeded ${MOVIES.length} movies.`);
}

main();
