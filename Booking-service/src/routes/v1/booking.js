/*
 * Booking resource routes.
 * Base path: /api/v1/booking
 *
 * POST /              → createBooking
 *   Body: { flightId, noofSeats }
 *   userId injected by API Gateway from JWT.
 *   Creates a new booking in INITIATED state and reserves seats on the flight service.
 *
 * POST /payment       → makePayment
 *   Body: { bookingId, totalCost }
 *   userId injected by API Gateway from JWT.
 *   Validates and confirms payment, marking booking as BOOKED.
 *
 * POST /cancel        → cancelUserBooking
 *   Body: { bookingId }
 *   userId injected by API Gateway from JWT.
 *   User-initiated cancellation — verifies ownership, cancels, restores seats via RabbitMQ.
 *
 * GET /my-bookings    → getMyBookings
 *   No body needed.
 *   Returns all bookings for the authenticated user, newest first.
 */

const express = require('express');
const { BookingController } = require('../../controllers');
const { idempotencyMiddleware } = require('../../middlewares');
const router = express.Router();

router.post('/', BookingController.createBooking);

// makePayment is protected by idempotency middleware
// Client must send a unique Idempotency-Key header (UUID) with every payment request
router.post('/payment', idempotencyMiddleware, BookingController.makePayment);

router.post('/cancel', BookingController.cancelUserBooking);

router.get('/my-bookings', BookingController.getMyBookings);

module.exports = router;
