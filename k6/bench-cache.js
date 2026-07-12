/**
 * bench-cache.js — measures Redis cache performance
 *
 * Uses a FIXED route + date + class so all VUs share the same cache key.
 * First request warms Redis; every subsequent request is a cache hit.
 * Run with indexes already in place (they were added in Stage 2).
 *
 * Usage:
 *   Stage 3 (indexes + cache): k6 run bench-cache.js
 *   No FLUSHALL needed — let it warm naturally.
 *
 * Hits the Flight Service directly on port 3000 (bypasses API Gateway rate limiter).
 */

import http from 'k6/http';
import { check } from 'k6';

export const options = {
  stages: [
    { duration: '5s',  target: 20 },  // ramp up fast — cache warms on first hit
    { duration: '45s', target: 20 },  // hold — almost all requests are cache hits
    { duration: '5s',  target: 0  },  // ramp down
  ],
  thresholds: {
    http_req_failed:   ['rate<0.01'],
    http_req_duration: ['p(95)<50'],  // tight — cache hits should be <10ms
  },
};

const BASE_URL = 'http://localhost:3000/api/v1/flights';

// Fixed query — all VUs share the same Redis cache key
// Pick a busy route and a date well within the seeded window
const TRIPS      = 'BOM-DEL';
const SEAT_CLASS = 'economy';

function fixedDate() {
  // 30 days from today — guaranteed to be in the seeded 180-day window
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().slice(0, 10);
}

const TRIP_DATE = fixedDate();

export default function () {
  const url = `${BASE_URL}?trips=${TRIPS}&tripDate=${TRIP_DATE}&travellers=1&seatClass=${SEAT_CLASS}`;

  const res = http.get(url);

  check(res, {
    'status 200': (r) => r.status === 200,
    'has data':   (r) => {
      try { return Array.isArray(JSON.parse(r.body).data); } catch { return false; }
    },
  });
}
