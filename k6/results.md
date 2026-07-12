# Benchmark Results

System: 162,000 Flights · 486,000 FlightClasses · 90 routes · 10 airports · 180-day window  
Load: 20 concurrent VUs · tested directly against Flight Service (port 3000)  
Date: 2026-05-10

---

## Stage 1 — No indexes, no cache (true worst case)

Script: `bench-db.js` · Redis flushed · all indexes dropped (including FK-backed composites)

| metric | value |
|---|---|
| avg | 2590ms |
| p(50) | 2770ms |
| p(90) | 3100ms |
| p(95) | 3180ms |
| max | 3520ms |
| req/s | 6.8 |

---

## Stage 2 — All indexes, no cache

Script: `bench-db.js` · Redis flushed · randomised route + date + class (61,200 possible cache keys → guaranteed cache miss)

| metric | value |
|---|---|
| avg | 84ms |
| p(50) | 88ms |
| p(90) | 125ms |
| p(95) | 139ms |
| max | 296ms |
| req/s | 205 |

---

## Stage 3 — Indexes + Redis cache (ceiling)

Script: `bench-cache.js` · fixed BOM-DEL query · single cache key warms on request #1 · pure cache-hit measurement

| metric | value |
|---|---|
| avg | 13ms |
| p(50) | 13ms |
| p(90) | 17ms |
| p(95) | 19ms |
| max | 70ms |
| req/s | 1267 |

---

## Stage 4 — Indexes + Redis cache (realistic Pareto 80/20)

Script: `bench-realistic.js` · Redis flushed at start · cache warms naturally during test  
80% traffic: 10 popular routes × 3 travel dates × 4 classes = 120 cache keys (warm within ~1s)  
20% traffic: random route + random date → near-certain cache miss, hits indexed DB

| metric | value |
|---|---|
| avg | 27ms |
| p(50) | 23ms |
| p(90) | 52ms |
| p(95) | 62ms |
| max | 256ms |
| req/s | 626 |

---

## Performance summary

Composite indexing + Redis caching (4-hr TTL) reduced p95 latency from 3.18s to 62ms at 626 req/s under realistic mixed traffic (80% popular routes served from cache, 20% long-tail hitting indexed DB).
