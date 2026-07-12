/**
 * V1 API Router — mounted at /api/v1
 * Aggregates all v1 resource routers under a single versioned prefix.
 *
 * /airplanes  → airplane-routes.js
 * /cities     → city-routes.js
 * /airports   → airport-routes.js
 * /flights    → flight-routes.js
 */
const express = require('express');
const airplaneRoutes = require('./airplane-routes')
const cityRoutes = require('./city-routes.js')
const airportRoutes = require('./airport-routes.js')
const flightRoutes = require('./flight-routes.js')
const router = express.Router();

router.use('/airplanes', airplaneRoutes);
router.use('/cities', cityRoutes);
router.use('/airports', airportRoutes);
router.use('/flights', flightRoutes);



module.exports = router;