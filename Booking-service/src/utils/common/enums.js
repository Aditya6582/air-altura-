/*
 * Enums
 *
 * Centralised constants used across the booking service.
 * Using string enums instead of magic strings prevents typos and makes
 * status values easy to search/refactor across the codebase.
 *
 * SEAT_TYPE    — types of seats on a flight (used by flight service, defined here for shared reference)
 * BOOKING_STATUS — all possible states a booking can be in during its lifecycle
 */

/*
 * BOOKING_STATUS lifecycle:
 *
 *   INITIATED → user has created a booking, seats reserved, payment not yet made
 *               has 5 minutes to complete payment before being auto-cancelled
 *
 *   BOOKED    → payment confirmed, booking is complete and permanent
 *
 *   CANCELLED → booking was either:
 *               (a) abandoned — cron job bulk-cancelled it after 5 min expiry
 *               (b) expired at payment time — makePayment hard-enforced the 5-min window
 *               (c) explicitly cancelled (future feature)
 *               Cancelled bookings are NEVER deleted — kept for audit, fraud detection, analytics
 *
 *   PENDING   → placeholder for a real payment gateway flow (not currently used):
 *               would represent "payment submitted, awaiting gateway confirmation"
 *               if implemented, would sit between INITIATED and BOOKED
 */
const BOOKING_STATUS = {
    BOOKED : 'booked',
    CANCELLED: 'cancelled',
    INITIATED: 'initiated',
    PENDING: 'pending'
}

/*
 * SEAT_TYPE — seat categories on a flight
 * Currently defined here for reference; actively used by the Flight Service.
 */
const SEAT_TYPE = {
    BUSINESS: 'business',
    ECONOMY : 'economy',
    FIRST_CLASS:'first-class',
    PREMIUM_ECONOMY:'premium-economy'
}


module.exports = {
    SEAT_TYPE,
    BOOKING_STATUS
}
