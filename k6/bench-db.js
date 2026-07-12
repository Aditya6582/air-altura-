/**
 * bench-db.js — measures raw DB performance (indexes vs no indexes)
 *
 * Run with Redis flushed before EACH execution so the cache never warms.
 * Uses randomised route + date combos → every request is a guaranteed cache miss.
 *
 * Usage:
 *   Stage 1 (no indexes): drop indexes → redis-cli FLUSHALL → k6 run bench-db.js
 *   Stage 2 (indexes):    add indexes  → redis-cli FLUSHALL → k6 run bench-db.js
 *
 * Hits the Flight Service directly on port 3000 (bypasses API Gateway rate limiter).
 */

import http from 'k6/http';
import { check } from 'k6';

export const options = {
  stages: [
    { duration: '10s', target: 20 },  // ramp up to 20 VUs
    { duration: '45s', target: 20 },  // hold — steady state
    { duration: '5s',  target: 0  },  // ramp down
  ],
  thresholds: {
    http_req_failed:   ['rate<0.01'],        // <1% errors
    http_req_duration: ['p(95)<2000'],       // p95 under 2s (loose — baseline may exceed)
  },
};

const BASE_URL = 'http://localhost:3000/api/v1/flights';

// All 10 seeded airports
const AIRPORTS = ['BOM', 'DEL', 'BLR', 'MAA', 'HYD', 'COK', 'CCU', 'AMD', 'JAI', 'PNQ'];

// All 4 seat classes
const SEAT_CLASSES = ['economy', 'premium-economy', 'business', 'first-class'];

// Seeded window: today + 0 to + 179 days
function randomDate() {
  const offset = Math.floor(Math.random() * 170) + 1; // days 1–170 (safe middle of window)
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

function randomRoute() {
  const from = AIRPORTS[Math.floor(Math.random() * AIRPORTS.length)];
  let to;
  do { to = AIRPORTS[Math.floor(Math.random() * AIRPORTS.length)]; } while (to === from);
  return `${from}-${to}`;
}

function randomClass() {
  return SEAT_CLASSES[Math.floor(Math.random() * SEAT_CLASSES.length)];
}

export default function () {
  const trips     = randomRoute();
  const tripDate  = randomDate();
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
