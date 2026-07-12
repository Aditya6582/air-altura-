# Air Altura

Air Altura is primarily an advanced airline booking system built as a full-stack microservices monorepo. The React frontend presents the system as a fictional airline website called "Air Altura" so the booking, payment, seat inventory, cancellation, and notification workflows can be tested end to end through a realistic user interface.

The repo includes an API gateway, flights service, booking service, notifications service, database/cache/queue infrastructure, and the Air Altura frontend demo.
## Architecture

<img width="1536" height="1024" alt="design_diagram_altura" src="https://github.com/user-attachments/assets/143767fe-bb07-4563-925c-4362e8a84c7a" />

## Run Locally

The fastest way to run the app is with Docker Compose from the repo root.

### Prerequisites

- Docker Desktop installed and running
- On Windows, use Docker Desktop with the WSL 2 backend enabled
- Git

### Start the app

```bash
git clone https://github.com/tejasganesh04/air-altura.git
cd air-altura
cp .env.docker.example .env.docker
docker compose up --build
```

Then open:

- Frontend: `http://localhost:5173`

The first startup can take a little while because MySQL initializes and the flights seed runs once.

### Windows Docker Desktop / WSL troubleshooting

If Docker Desktop repeatedly shows a popup like:

```text
WSL integration with distro 'Ubuntu' unexpectedly stopped
```

or `docker compose` fails with a Docker Desktop WSL error, the issue is usually Docker Desktop's WSL integration rather than this project.

Try this first:

```powershell
wsl --shutdown
```

Then fully quit and reopen Docker Desktop, wait until it says it is running, and run Docker Compose again from the repo root:

```powershell
docker compose up -d --build
```

If the popup keeps returning, open Docker Desktop and go to **Settings -> Resources -> WSL Integration**. Turn off integration for the affected `Ubuntu` distro and click **Apply & restart**. This project can still be run from PowerShell or Command Prompt without enabling per-distro Ubuntu integration.

### Stop the app

```bash
docker compose down
```

To also remove local Docker volumes and reset all seeded/local data:

```bash
docker compose down -v
```

### What starts

`docker compose up` starts:

- Frontend on `5173`
- API Gateway on `5000`
- Flights Service on `3000`
- Booking Service on `4000`
- MySQL on `3307`
- Redis on `6380`
- RabbitMQ on `5672`
- RabbitMQ Management UI on `15672`

### Local data and tools

All databases and queues run locally in Docker containers.

- MySQL host for local tools: `127.0.0.1`
- MySQL port: `3307`
- MySQL user: `root`
- MySQL password: value from `.env.docker`
- RabbitMQ UI: `http://localhost:15672`
- RabbitMQ default login: `guest` / `guest`

MySQL databases created by the stack:

- `auth_db`
- `FLIGHTS`
- `bookings_db`

### Email in local Docker

The app works without email configuration, but confirmation emails will only send if you provide valid Resend credentials.

Update `.env.docker` with:

```env
RESEND_API_KEY=your_resend_api_key
FROM_EMAIL=your_verified_sender@yourdomain.com
```

Then rebuild the notifications service:

```bash
docker compose up -d --build notifications-service
```

Notes:

- `onboarding@resend.dev` is only for limited testing.
- To send real emails to real users, use a verified domain in Resend.

## Environment Files

For local Docker, this repo uses:

- `.env.docker.example` as the template
- `.env.docker` as your local working copy

Do not commit real secrets.

## Production Email Setup

If someone deploys this project publicly, they should use their own Resend account and domain.

Required steps:

1. Create a Resend account.
2. Verify a domain or subdomain they control.
3. Generate their own `RESEND_API_KEY`.
4. Set `RESEND_API_KEY`.
5. Set `FROM_EMAIL`.
6. Deploy or restart the notifications service with those environment variables.

Without that setup, the app can still run, but booking confirmation emails will not be delivered.

## Architecture
check out the detailed architecture in the
## Services

| Service | Port | Responsibility |
|---|---:|---|
| Frontend | 5173 | React application |
| API Gateway | 5000 | Auth, proxying, rate limiting |
| Flights Service | 3000 | Flights, search, seat inventory |
| Booking Service | 4000 | Booking lifecycle, payment flow, booking expiry |
| Notifications Service | - | Queue consumer for confirmation emails |
| MySQL | 3307 | Persistent storage |
| Redis | 6380 | Caching, token blacklist, idempotency |
| RabbitMQ | 5672 | Async events |
| RabbitMQ UI | 15672 | Queue inspection |

## Main Features

- User registration and login
- Flight search by route, date, travellers, class, stops, and sorting
- Booking creation with reserved seats
- 10-minute payment window
- Payment confirmation with idempotency protection
- Automatic booking expiry and seat restoration
- Booking history
- Confirmation email after successful payment

## Technical Highlights

- Node.js microservices
- API Gateway as the single public backend entry point
- MySQL with Sequelize migrations
- Redis for caching, JWT blacklist, and payment idempotency
- RabbitMQ for seat restoration and booking confirmation events
- Docker Compose for one-command local setup

## API Overview

All frontend API traffic goes through the API gateway on `http://localhost:5000/api/v1`.

### Auth

- `POST /auth/register`
- `POST /auth/login`
- `DELETE /auth/logout`

### Flights

- `GET /flights`
- `GET /flights/:id`
- `POST /flights`

### Bookings

- `POST /booking`
- `POST /booking/payment`
- `POST /booking/cancel`
- `GET /booking/my-bookings`

## Technical Design

### ACID Transactions & Double-Booking Prevention

Every seat-count mutation runs inside a Sequelize unmanaged transaction with a `SELECT ... FOR UPDATE` row lock on the `FlightClasses` row. This serialises concurrent booking requests for the same cabin: the second request blocks at the lock until the first commits, then reads the updated count. If the locked row now has insufficient seats, it gets a 400, not a negative seat count.

The booking creation itself is a cross-service transaction — the booking record and the HTTP seat deduction to the Flights Service must both succeed. If the PATCH fails, the transaction rolls back and no ghost booking persists.

### Seat Expiry: Two-Layer System

The 10-minute payment window is enforced by two independent mechanisms running in parallel:

- **Cron janitor** — runs every 5 minutes, bulk-cancels all `INITIATED` bookings older than 10 minutes, publishes one `seat.restoration` RabbitMQ event per booking.
- **Payment bouncer** — at the moment a user calls `/payment`, the service checks the booking age. If expired, it cancels immediately and returns 400, closing the worst-case 5-minute cron lag.

### Idempotency on Payment

The `POST /booking/payment` endpoint requires an `Idempotency-Key` UUID header. The first call executes the payment and caches `{ statusCode, body }` in Redis for 24 hours. Any retry with the same key returns the cached response — the handler never runs twice. Only 2xx responses are cached; a failed payment can be retried with the same key after the client corrects the issue.

If Redis is down, the middleware fails open and lets the request through rather than blocking the payment endpoint.

### Event-Driven Seat Restoration

All seat restoration on cancellation (manual, cron, or payment expiry) goes through a durable RabbitMQ `seat.restoration` queue. The Flights Service subscribes and increments the cabin seat count. Events survive RabbitMQ restarts (`persistent: true`) and wait in the queue if the Flights Service is temporarily down — no seat count is permanently lost.

Events are published **after** the transaction commits, never inside it. The DB is the source of truth.

### Redis Caching

Flight search results are cached for 4 hours. The cache key is a stable JSON serialisation of the query parameters with keys sorted alphabetically, so `?trips=X&tripDate=Y` and `?tripDate=Y&trips=X` hit the same key.

The flight detail page (used at booking time) always hits the DB directly — seat counts must be live.

Both the cache read and write are wrapped in independent try/catch blocks. Redis failure degrades to direct DB queries, never a 500 error.

### API Gateway Trust Model

The API Gateway decodes the JWT and injects `x-user-id` and `x-user-email` headers before proxying. Downstream services read the user identity from these headers — never from the request body. This prevents clients from fabricating a userId to access another user's bookings.

On logout, the token is added to a Redis blacklist (`blacklist:<token>`). Every authenticated request checks this key before verifying the JWT signature.

### Multi-Cabin Schema (v2)

Flights have a separate `FlightClasses` table with one row per cabin (`economy`, `premium-economy`, `business`, `first-class`), each with its own `price` and `totalSeats`. Seat deductions and restorations target the specific cabin row. Flight creation with multiple cabins is atomic — if the `FlightClass` bulk insert fails, the parent `Flight` row is rolled back.

---

## Future Scope

Features that are natural extensions to this system but not currently implemented:

**Booking experience**
- **Seat map selection** — individual seat assignment per passenger (requires a `Seats` table with row/column/status per flight, and a seat-hold mechanism similar to the current booking INITIATED state)
- **Round-trip booking** — link two one-way bookings into a single itinerary; calculate combined price and allow cancelling both legs together
- **Multi-city / stopover booking** — chain more than two flights into one reservation
- **Passenger details** — collect and store name, passport/ID, date of birth per traveller rather than just a seat count
- **PNR / boarding pass generation** — generate a unique PNR number and a PDF boarding pass on booking confirmation

**Payment**
- **Real payment gateway** — replace the simulated payment with Stripe or Razorpay; handle webhooks for async payment confirmation
- **Refund processing** — issue refunds on cancellation rather than only restoring seats; track refund status

**Inventory & scheduling**
- **Waitlisting** — queue users when a cabin is full; auto-confirm when a seat becomes available
- **Flight status** — track delays, gate changes, and cancellations; push notifications to affected passengers
- **Fare classes within a cabin** — multiple price tiers (saver, flexible, fully refundable) within the same cabin class

**User features**
- **Frequent flyer / loyalty points** — accrue and redeem miles per booking
- **Saved travellers** — store passenger profiles for faster repeat booking
- **Price alerts** — notify users when a watched route drops below a target price
- **Check-in flow** — online check-in window (e.g. 24 hours before departure), seat confirmation, digital boarding card

**Admin**
- **Admin UI** — a dashboard for creating flights, viewing bookings, and managing inventory (currently flight creation is API-only)
- **Analytics** — load factor per flight, revenue per route, cancellation rate

**Auth**
- **Social login** — OAuth with Google or GitHub (currently email/password only)
- **Email verification** — confirm email address on registration before allowing bookings

---

## Development Notes

- The notifications service has no HTTP server. It stays alive as a RabbitMQ consumer.
- The flights dataset is seeded through a one-time `flights-seeder` service.
- The frontend is served from nginx in Docker, not the Vite dev server.

## k6 Performance Testing

The `k6` project was used to benchmark the performance of the Flights Service under various configurations. The goal was to measure and optimize the latency and throughput of the `GET /api/v1/flights` endpoint, which is critical for the flight search functionality.

### Thought Process

1. **Stage 1 — No indexes, no cache (worst-case baseline):**
   - Dropped all foreign key constraints and composite indexes.
   - Flushed Redis to ensure no cached results.
   - Measured raw database performance under worst-case conditions.

2. **Stage 2 — All indexes, no cache:**
   - Recreated all necessary indexes and foreign key constraints.
   - Flushed Redis to ensure no cached results.
   - Measured the impact of indexing on database query performance.

3. **Stage 3 — Indexes + cache ceiling:**
   - Kept indexes in place.
   - Measured the best-case performance with a single cache key (pure cache-hit scenario).

4. **Stage 4 — Indexes + cache (realistic Pareto 80/20):**
   - Flushed Redis to start with a cold cache.
   - Simulated realistic traffic: 80% of requests targeting popular routes (cache hits) and 20% targeting random routes (cache misses).

### Results

| Stage | Avg Latency | P95 Latency | Max Latency | Requests/sec |
|---|---|---|---|---|
| **1. No indexes, no cache** | 2590ms | 3180ms | 3520ms | 6.8 |
| **2. All indexes, no cache** | 84ms | 139ms | 296ms | 205 |
| **3. Indexes + cache ceiling** | 13ms | 19ms | 70ms | 1267 |
| **4. Indexes + cache (realistic)** | 27ms | 62ms | 256ms | 626 |

### Key Insights

- **Indexes:** Adding composite indexes reduced p95 latency from 3.18s to 139ms, a 22x improvement.
- **Redis Cache:** Leveraging a 4-hour TTL cache further reduced p95 latency to 62ms under realistic traffic.
- **Throughput:** The system achieved 626 requests per second under realistic traffic, with 80% of requests served from cache.

### Running the Tests

The `k6` tests are located in the `k6/` directory. To run the tests:

1. Install `k6`:
   ```bash
   choco install k6
   ```

2. Navigate to the `k6/` directory:
   ```bash
   cd k6
   ```

3. Run the desired test script:
   - **Stage 1:**
     ```bash
     k6 run bench-db.js
     ```
   - **Stage 2:**
     ```bash
     k6 run bench-db.js
     ```
   - **Stage 3:**
     ```bash
     k6 run bench-cache.js
     ```
   - **Stage 4:**
     ```bash
     k6 run bench-realistic.js
     ```

4. View the results in `k6/results.md` for detailed metrics and insights.
