/*
 * V1 API router.
 *
 * Registers all resource-level routers for version 1 of the API.
 *
 * Current routes:
 *   /api/v1/booking  →  bookingRoutes
 */

const express = require('express');


const bookingRoutes = require('./booking');
const router = express.Router()




router.use('/booking', bookingRoutes);

 
module.exports = router;