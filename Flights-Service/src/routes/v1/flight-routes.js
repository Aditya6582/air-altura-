/**
 * Flight Routes — mounted at /api/v1/flights
 *
 * POST   /              → create a new flight (requires all flight fields in body)
 * GET    /              → fetch all flights (supports query filters: trips, price, travellers, tripDate, sort)
 * GET    /:id           → fetch a single flight by primary key (used by Booking Service)
 * PATCH  /:id/seats     → atomically update remaining seat count (used by Booking Service on payment/cancellation)
 */
const express = require('express');
const router = express.Router();
const {FlightMiddlewares} = require('../../middlewares');
const {FlightController} = require('../../controllers');

// Validate required fields before allowing flight creation
router.post('/', FlightMiddlewares.validateCreateRequest, FlightController.createFlight);

// No middleware needed — filters are optional query params
router.get('/', FlightController.getAllFlights);

// Fetch a specific flight by id — consumed by the Booking Service
router.get('/:id', FlightController.getFlight);

// Validate that `seats` is present in body before updating seat count
router.patch('/:id/seats', FlightMiddlewares.validateUpdateSeatsRequest, FlightController.updateSeats);

module.exports = router;


