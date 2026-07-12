/**
 * bench-realistic.js — Pareto (80/20) mixed traffic benchmark
 *
 * Models real flight search behaviour:
 *   - 80% of searches go to 10 high-traffic routes (BOM-DEL, BOM-BLR, etc.)
 *     on one of 3 popular travel dates (next weekend, 2 weeks, 1 month out)
 *     → these warm the Redis cache quickly; after the first hit, all repeats are cache hits
 *   - 20% of searches are unique (random route + random date from the 180-day window)
 *     → these always miss cache and hit the indexed DB
 *
 * This reflects how a real airline search engine works:
 *   A small number of popular corridors dominate traffic.
 *   Those slots warm in Redis within the first few seconds.
 *   Long-tail searches always go to the DB.
 *
 * Run AFTER indexes are in place (Stage 2 completed).
 * Do NOT flush Redis before running — let it warm naturally during the test.
 */

import http from 'k6/http';
import { check } from 'k6';

export const options = {
  stages: [
    { duration: '10s', target: 20 },
    { duration: '45s', target: 20 },
    { duration: '5s',  target: 0  },
  ],
  thresholds: {
    http_req_failed:   ['rate<0.01'],
    http_req_duration: ['p(95)<500'],
  },
};

const BASE_URL = 'http://localhost:3000/api/v1/flights';

// Top 10 high-traffic domestic corridors (these warm the cache fast)
const POPULAR_ROUTES = [
  'BOM-DEL', 'DEL-BOM',
  'BOM-BLR', 'BLR-BOM',
  'DEL-BLR', 'BLR-DEL',
  'BOM-MAA', 'MAA-BOM',
  'DEL-MAA', 'MAA-DEL',
];

// All 10 airports for long-tail random routes
const ALL_AIRPORTS = ['BOM', 'DEL', 'BLR', 'MAA', 'HYD', 'COK', 'CCU', 'AMD', 'JAI', 'PNQ'];

const SEAT_CLASSES = ['economy', 'premium-economy', 'business', 'first-class'];

// 3 popular travel dates — fixed so they cache after first hit
function popularDates() {
  const dates = [];
  for (const offset of [7, 14, 30]) {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}
const POPULAR_DATES = popularDates();

function randomDate() {
  const offset = Math.floor(Math.random() * 160) + 5;
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

function randomRoute() {
  const from = ALL_AIRPORTS[Math.floor(Math.random() * ALL_AIRPORTS.length)];
  let to;
  do { to = ALL_AIRPORTS[Math.floor(Math.random() * ALL_AIRPORTS.length)]; } while (to === from);
  return `${from}-${to}`;
}

function randomClass() {
  return SEAT_CLASSES[Math.floor(Math.random() * SEAT_CLASSES.length)];
}

export default function () {
  let trips, tripDate;

  if (Math.random() < 0.8) {
    // 80%: popular route + popular date → cache hit after warmup
    trips    = POPULAR_ROUTES[Math.floor(Math.random() * POPULAR_ROUTES.length)];
    tripDate = POPULAR_DATES[Math.floor(Math.random() * POPULAR_DATES.length)];
  } else {
    // 20%: random route + random date → almost always a cache miss
    trips    = randomRoute();
    tripDate = randomDate();
  }

  const seatClass = randomClass();
  const url = `${BASE_URL}?trips=${trips}&tripDate=${tripDate}&travellers=1&seatClass=${seatClass}`;

  const res = http.get(url);

  check(res, {
    'status 200': (r) => r.status === 200,
    'has data':   (r) => {
      try { return Array.isArray(JSON.parse(r.body).data); } catch { return false; }
    },
  });
}
