# k6 Benchmark Runbook

## What we're measuring
Flight search endpoint: `GET /api/v1/flights?trips=BOM-DEL&tripDate=...&travellers=1&seatClass=economy`

Tested directly against Flight Service (port 3000) to isolate DB/cache performance
from API Gateway rate limiting.

Data scale: 162,000 Flights × ~486,000 FlightClasses × 10 airports × 90 routes × 180 days.

Results are recorded in `results.md`.

---

## Stage 1 — No indexes, no cache (worst case baseline)

First find and drop FK constraints backing the composite indexes:

```sql
USE flights;
ALTER TABLE flights DROP FOREIGN KEY flights_ibfk_2;
ALTER TABLE flights DROP FOREIGN KEY flights_ibfk_3;
ALTER TABLE flightclasses DROP FOREIGN KEY flightclasses_ibfk_1;

DROP INDEX idx_flights_route ON flights;
DROP INDEX idx_flights_departure_time ON Flights;
DROP INDEX idx_flights_price ON Flights;
DROP INDEX idx_flightclasses_flight_class ON flightclasses;
DROP INDEX idx_flightclasses_price ON FlightClasses;
DROP INDEX idx_flightclasses_total_seats ON FlightClasses;
```

Flush Redis:
```
docker exec redis redis-cli FLUSHALL
```

Run:
```
k6 run bench-db.js
```

---

## Stage 2 — All indexes, no cache

Recreate indexes and FK constraints:

```sql
USE flights;
CREATE INDEX idx_flights_route ON flights (departureAirportId, arrivalAirportId);
CREATE INDEX idx_flights_departure_time ON Flights (departureTime);
CREATE INDEX idx_flights_price ON Flights (price);
CREATE UNIQUE INDEX idx_flightclasses_flight_class ON flightclasses (flightId, seatClass);
CREATE INDEX idx_flightclasses_price ON FlightClasses (price);
CREATE INDEX idx_flightclasses_total_seats ON FlightClasses (totalSeats);

ALTER TABLE flights ADD CONSTRAINT flights_ibfk_2
  FOREIGN KEY (departureAirportId) REFERENCES airports(code) ON DELETE CASCADE;
ALTER TABLE flights ADD CONSTRAINT flights_ibfk_3
  FOREIGN KEY (arrivalAirportId) REFERENCES airports(code) ON DELETE CASCADE;
ALTER TABLE flightclasses ADD CONSTRAINT flightclasses_ibfk_1
  FOREIGN KEY (flightId) REFERENCES flights(id) ON DELETE CASCADE;
```

Flush Redis:
```
docker exec redis redis-cli FLUSHALL
```

Run:
```
k6 run bench-db.js
```

---

## Stage 3 — Indexes + cache ceiling

Indexes already in place. Do NOT flush Redis.

Run:
```
k6 run bench-cache.js
```

Fixed BOM-DEL query — cache warms on first hit, all subsequent requests are Redis hits.
Measures pure cache-hit ceiling, not average production performance.

---

## Stage 4 — Indexes + cache (realistic Pareto 80/20)

Flush Redis so cache warms naturally from cold:
```
docker exec redis redis-cli FLUSHALL
```

Run:
```
k6 run bench-realistic.js
```

80% of traffic hits 10 popular routes × 3 travel dates × 4 classes (120 cache keys).
20% hits random routes and dates — cache misses, served by indexed DB.
This is the production-representative number.
