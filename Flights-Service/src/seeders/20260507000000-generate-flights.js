'use strict';

/*
 * Flight Generator Seeder — v2
 *
 * Volume:
 *   10 airports × 9 destinations = 90 bidirectional routes
 *   10 departure slots/day per route
 *   180-day booking window
 *   = 90 × 10 × 180 = 162,000 Flights
 *   + up to 4 FlightClass rows per flight (~486,000 rows)
 *   + FlightStop rows for ONE_STOP flights (~40,000 rows)
 *
 * Complexity for filter testing:
 *   - DIRECT and ONE_STOP flights (ONE_STOP when durationMins > 100 AND routeIdx % 3 === 0)
 *   - All 4 seat classes; A320/B737 skip first-class (0 seats)
 *   - Wide price range: economy ₹2k–7k, first-class up to ₹45k+
 *   - Seat availability: ~20% nearly full, ~20% half, ~60% full inventory
 *   - 8 carrier codes, 10 airports, 45 unique route pairs
 *
 * Identification:
 *   boardingGate = 'SEED' — down() deletes only this marker; CASCADE handles child tables.
 */

const SEAT_CLASSES = ['economy', 'premium-economy', 'business', 'first-class'];

const CLASS_PRICE_MULTIPLIER = {
  'economy':         1.0,
  'premium-economy': 1.8,
  'business':        3.5,
  'first-class':     6.5,
};

// Per-class seat capacity by airplane ID (A320=1, B777=2, A380=3, B737=4)
const AIRPLANE_CLASS_SEATS = {
  1: { 'economy': 144, 'premium-economy': 24, 'business': 12, 'first-class':  0 },
  2: { 'economy': 300, 'premium-economy': 52, 'business': 36, 'first-class':  8 },
  3: { 'economy': 420, 'premium-economy': 76, 'business': 48, 'first-class': 11 },
  4: { 'economy': 132, 'premium-economy': 18, 'business': 10, 'first-class':  0 },
};

// 45 unique pairs — both directions built programmatically (90 routes total)
const DURATION_MAP = {
  'BOM-DEL': 130, 'BOM-BLR': 105, 'BOM-MAA': 135, 'BOM-HYD':  90, 'BOM-COK': 150,
  'BOM-CCU': 170, 'BOM-AMD':  65, 'BOM-JAI': 110, 'BOM-PNQ':  40,
  'DEL-BLR': 165, 'DEL-MAA': 180, 'DEL-HYD': 140, 'DEL-COK': 195, 'DEL-CCU': 130,
  'DEL-AMD':  95, 'DEL-JAI':  60, 'DEL-PNQ': 150,
  'BLR-MAA':  60, 'BLR-HYD':  75, 'BLR-COK':  90, 'BLR-CCU': 175, 'BLR-AMD': 155,
  'BLR-JAI': 195, 'BLR-PNQ': 135,
  'MAA-HYD':  80, 'MAA-COK':  80, 'MAA-CCU': 165, 'MAA-AMD': 165, 'MAA-JAI': 195,
  'MAA-PNQ': 140,
  'HYD-COK': 105, 'HYD-CCU': 155, 'HYD-AMD': 130, 'HYD-JAI': 165, 'HYD-PNQ':  90,
  'COK-CCU': 190, 'COK-AMD': 170, 'COK-JAI': 210, 'COK-PNQ': 155,
  'CCU-AMD': 185, 'CCU-JAI': 185, 'CCU-PNQ': 175,
  'AMD-JAI':  50, 'AMD-PNQ':  70,
  'JAI-PNQ': 130,
};

const ALL_AIRPORTS = ['BOM', 'DEL', 'BLR', 'MAA', 'HYD', 'COK', 'CCU', 'AMD', 'JAI', 'PNQ'];

const DEPARTURE_TIMES = [
  { hours:  6, mins:  0 },
  { hours:  7, mins: 30 },
  { hours:  9, mins:  0 },
  { hours: 10, mins: 30 },
  { hours: 12, mins:  0 },
  { hours: 13, mins: 30 },
  { hours: 15, mins:  0 },
  { hours: 16, mins: 30 },
  { hours: 18, mins:  0 },
  { hours: 19, mins: 30 },
];

const CARRIERS  = ['6E', 'AI', 'SG', 'UK', 'IX', 'G8', 'QP', 'I5'];
const AIRPLANES = [1, 2, 3, 4]; // airplane IDs

const CITIES_TO_ADD = [
  'Hyderabad', 'Kochi', 'Kolkata', 'Ahmedabad', 'Jaipur', 'Pune',
];

const AIRPORT_DEFINITIONS = [
  { name: 'Rajiv Gandhi International Airport',               code: 'HYD', address: 'Hyderabad', cityName: 'Hyderabad' },
  { name: 'Cochin International Airport',                     code: 'COK', address: 'Kochi',     cityName: 'Kochi'     },
  { name: 'Netaji Subhas Chandra Bose International Airport', code: 'CCU', address: 'Kolkata',   cityName: 'Kolkata'   },
  { name: 'Sardar Vallabhbhai Patel International Airport',   code: 'AMD', address: 'Ahmedabad', cityName: 'Ahmedabad' },
  { name: 'Jaipur International Airport',                     code: 'JAI', address: 'Jaipur',    cityName: 'Jaipur'    },
  { name: 'Pune Airport',                                     code: 'PNQ', address: 'Pune',      cityName: 'Pune'      },
];

function buildRoutes() {
  const routes = [];
  for (const [key, durationMins] of Object.entries(DURATION_MAP)) {
    const [from, to] = key.split('-');
    routes.push({ from, to, durationMins });
    routes.push({ from: to, to: from, durationMins });
  }
  return routes; // 90 entries
}

function flightNumber(routeIdx, timeIdx, dayIdx) {
  const carrier = CARRIERS[(routeIdx + timeIdx) % CARRIERS.length];
  const num = String(((routeIdx * 10 + timeIdx) * 13 + dayIdx) % 9000 + 1000);
  return `${carrier}${num}`;
}

function baseEconomyPrice(durationMins, routeIdx, timeIdx, dayIdx) {
  const base      = 1500 + durationMins * 12;
  const variation = (routeIdx * 113 + timeIdx * 57 + dayIdx * 7) % 3000;
  return Math.round(base + variation);
}

// Returns the fraction of class inventory still available — creates a realistic mix
// for testing seat-count filters (travellers >= N)
function availFactor(routeIdx, timeIdx) {
  const hash = (routeIdx * 3 + timeIdx) % 5;
  if (hash === 0) return 0.12; // ~12% left — nearly full (high-demand slot)
  if (hash === 1) return 0.45; // ~45% left — moderately sold
  return 1.0;                  // full inventory
}

module.exports = {
  async up(queryInterface) {
    const now   = new Date();
    const BATCH = 1000;

    // ── 1. Cities ──────────────────────────────────────────────────────────────
    await queryInterface.bulkInsert('Cities',
      CITIES_TO_ADD.map(name => ({ name, createdAt: now, updatedAt: now }))
    );

    const cityRows = await queryInterface.sequelize.query(
      `SELECT id, name FROM Cities WHERE name IN (${CITIES_TO_ADD.map(() => '?').join(',')})`,
      { replacements: CITIES_TO_ADD, type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    const cityMap = {};
    for (const row of cityRows) cityMap[row.name] = row.id;

    // ── 2. Airports ────────────────────────────────────────────────────────────
    await queryInterface.bulkInsert('Airports',
      AIRPORT_DEFINITIONS.map(a => ({
        name: a.name, code: a.code, address: a.address,
        cityId: cityMap[a.cityName],
        createdAt: now, updatedAt: now,
      }))
    );

    // ── 3. Routes ──────────────────────────────────────────────────────────────
    const ROUTES = buildRoutes(); // 90

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // ── 4. Day loop ────────────────────────────────────────────────────────────
    for (let day = 0; day < 180; day++) {
      const date = new Date(today);
      date.setDate(date.getDate() + day);

      const dayStart = new Date(date);
      const dayEnd   = new Date(date);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const flightRows = [];
      const meta       = [];   // parallel array — same length, same order as flightRows

      for (let routeIdx = 0; routeIdx < ROUTES.length; routeIdx++) {
        const route      = ROUTES[routeIdx];
        // ONE_STOP: only on longer routes (>100 min) and every 3rd routeIdx
        const isOneStop  = route.durationMins > 100 && routeIdx % 3 === 0;
        const airplaneId = AIRPLANES[(routeIdx + day) % AIRPLANES.length];

        // Intermediate stop airport (pick from airports that aren't origin or destination)
        let stopAirportCode = null;
        if (isOneStop) {
          const eligible  = ALL_AIRPORTS.filter(a => a !== route.from && a !== route.to);
          stopAirportCode = eligible[(routeIdx * 7) % eligible.length];
        }

        for (let timeIdx = 0; timeIdx < DEPARTURE_TIMES.length; timeIdx++) {
          const slot        = DEPARTURE_TIMES[timeIdx];
          const basePrice   = baseEconomyPrice(route.durationMins, routeIdx, timeIdx, day);
          // Layover varies by slot: 35–80 min, giving distinct values to test layover filtering
          const layoverMins = isOneStop ? (35 + timeIdx * 5) : 0;

          const departureTime = new Date(date);
          departureTime.setHours(slot.hours, slot.mins, 0, 0);

          const arrivalTime = new Date(departureTime);
          arrivalTime.setMinutes(arrivalTime.getMinutes() + route.durationMins + layoverMins);

          flightRows.push({
            flightNumber:      flightNumber(routeIdx, timeIdx, day),
            airplaneId,
            departureAirportId: route.from,
            arrivalAirportId:   route.to,
            departureTime,
            arrivalTime,
            price:      basePrice,   // economy base — kept for backward compat (Stage 6 removes this)
            totalSeats: AIRPLANE_CLASS_SEATS[airplaneId]['economy'],
            boardingGate: 'SEED',
            stopType:   isOneStop ? 'ONE_STOP' : 'DIRECT',
            createdAt: now,
            updatedAt: now,
          });

          meta.push({ routeIdx, timeIdx, airplaneId, basePrice, isOneStop, stopAirportCode, layoverMins, departureTime, route });
        }
      }

      // Insert this day's flights
      for (let i = 0; i < flightRows.length; i += BATCH) {
        await queryInterface.bulkInsert('Flights', flightRows.slice(i, i + BATCH));
      }

      // Read back IDs in insertion order (ORDER BY id ASC is safe because auto-increment
      // is strictly sequential within a single-connection bulk insert)
      const inserted = await queryInterface.sequelize.query(
        `SELECT id FROM Flights WHERE boardingGate = 'SEED' AND departureTime >= ? AND departureTime < ? ORDER BY id ASC`,
        { replacements: [dayStart, dayEnd], type: queryInterface.sequelize.QueryTypes.SELECT }
      );

      const flightClasses = [];
      const flightStops   = [];

      for (let i = 0; i < inserted.length; i++) {
        const flightId  = inserted[i].id;
        const m         = meta[i];
        const classCaps = AIRPLANE_CLASS_SEATS[m.airplaneId];
        const factor    = availFactor(m.routeIdx, m.timeIdx);

        for (const seatClass of SEAT_CLASSES) {
          const capacity = classCaps[seatClass];
          if (!capacity) continue; // A320/B737 have 0 first-class seats — skip

          flightClasses.push({
            flightId,
            seatClass,
            price:      Math.round(m.basePrice * CLASS_PRICE_MULTIPLIER[seatClass]),
            totalSeats: Math.max(1, Math.floor(capacity * factor)),
            createdAt: now,
            updatedAt: now,
          });
        }

        if (m.isOneStop) {
          // Stop at roughly the midpoint of the direct flight time
          const stopArrival = new Date(m.departureTime);
          stopArrival.setMinutes(stopArrival.getMinutes() + Math.floor(m.route.durationMins / 2));

          const stopDeparture = new Date(stopArrival);
          stopDeparture.setMinutes(stopDeparture.getMinutes() + m.layoverMins);

          flightStops.push({
            flightId,
            airportCode:   m.stopAirportCode,
            arrivalTime:   stopArrival,
            departureTime: stopDeparture,
            layoverMins:   m.layoverMins,
            createdAt: now,
            updatedAt: now,
          });
        }
      }

      for (let i = 0; i < flightClasses.length; i += BATCH) {
        await queryInterface.bulkInsert('FlightClasses', flightClasses.slice(i, i + BATCH));
      }
      for (let i = 0; i < flightStops.length; i += BATCH) {
        await queryInterface.bulkInsert('FlightStops', flightStops.slice(i, i + BATCH));
      }

      if (day % 30 === 0) console.log(`  Seeded day ${day}/179...`);
    }

    const [{ total }] = await queryInterface.sequelize.query(
      "SELECT COUNT(*) as total FROM Flights WHERE boardingGate = 'SEED'",
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    console.log(`Done. ${total} flights seeded across 90 routes, 10 airports, 180 days.`);
  },

  async down(queryInterface) {
    // Raw DELETE so CASCADE removes FlightClasses + FlightStops automatically
    await queryInterface.sequelize.query("DELETE FROM Flights WHERE boardingGate = 'SEED'");
    await queryInterface.bulkDelete('Airports', { code: ['HYD', 'COK', 'CCU', 'AMD', 'JAI', 'PNQ'] }, {});
    await queryInterface.bulkDelete('Cities',   { name: CITIES_TO_ADD }, {});
  },
};
