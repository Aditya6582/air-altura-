
/*
 * Booking Controller
 *
 * Sits between the routes and the service layer.
 * Responsibilities:
 *  - Extract and validate request data from req.body
 *  - Call the appropriate BookingService function
 *  - Send a standardised success or error response back to the client
 *
 * It does NOT contain any business logic — that lives in the service layer.
 */

const {StatusCodes} = require('http-status-codes')
const BookingService = require('../services/booking-service')
const {SuccessResponse,ErrorResponse} = require('../utils/common');

/*
 * createBooking
 *
 * Receives:  POST /api/v1/booking
 *   req.body: {
 *     flightId  (required) — which flight to book
 *     noofSeats (required) — how many seats the user wants
 *     userId    (optional) — who is making the booking
 *   }
 *
 * Calls:     BookingService.createBooking()
 *
 * Responds:
 *   200 OK    — booking created, returns booking object (id, status, totalCost, noOfSeats etc.)
 *   400/500   — not enough seats, flight not found, or unexpected error
 */
async function createBooking(req,res){
    try {

        const response = await BookingService.createBooking({
            flightId:  req.body.flightId,    // mandatory
            noofSeats: req.body.noofSeats,   // mandatory
            userId:    req.headers['x-user-id'], // injected by API Gateway from JWT — never trust client-supplied userId
            seatClass: req.body.seatClass    // optional — defaults to 'economy' in the service
        });
        SuccessResponse.data= response;
        return res.status(StatusCodes.OK).json(SuccessResponse)
    } catch (error) {
        ErrorResponse.error = error;
        // fallback to 500 if error is not an AppError (no statusCode property)
        return res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json(ErrorResponse);
    }

}


/*
 * makePayment
 *
 * Receives:  POST /api/v1/booking/payment
 *   req.body: {
 *     bookingId (required) — the booking to complete payment for
 *     userId    (required) — must match the userId on the booking
 *     totalCost (required) — must match the totalCost stored on the booking
 *   }
 *
 * Calls:     BookingService.makePayment()
 *
 * Responds:
 *   200 OK    — payment confirmed, booking status updated to BOOKED
 *   400       — booking expired, cost mismatch, userId mismatch
 *   500       — unexpected server error
 */
async function makePayment(req,res){
    try {
        const response = await BookingService.makePayment({
            bookingId: req.body.bookingId,
            userId:    req.headers['x-user-id'],    // injected by API Gateway from JWT
            email:     req.headers['x-user-email'], // injected by API Gateway from JWT
            totalCost: req.body.totalCost
        });
        SuccessResponse.data= response;
        return res.status(StatusCodes.OK).json(SuccessResponse)
    } catch (error) {
        ErrorResponse.error = error;
        // fallback to 500 if error is not an AppError (no statusCode property)
        return res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json(ErrorResponse);
    }

}





/*
 * cancelUserBooking
 *
 * Receives:  POST /api/v1/booking/cancel
 *   req.body: { bookingId (required) }
 *   userId injected by API Gateway from JWT — never from body
 *
 * Responds:
 *   200 OK  — booking cancelled (or already was cancelled — idempotent)
 *   403     — booking belongs to a different user
 *   404     — booking not found
 *   500     — unexpected error
 */
async function cancelUserBooking(req, res) {
    try {
        await BookingService.cancelUserBooking({
            bookingId: req.body.bookingId,
            userId: req.headers['x-user-id']
        });
        SuccessResponse.data = { message: 'Booking cancelled successfully' };
        return res.status(StatusCodes.OK).json(SuccessResponse);
    } catch (error) {
        ErrorResponse.error = error;
        return res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json(ErrorResponse);
    }
}


/*
 * getMyBookings
 *
 * Receives:  GET /api/v1/booking/my-bookings
 *   userId injected by API Gateway from JWT — no body needed
 *
 * Responds:
 *   200 OK  — array of bookings for the authenticated user (may be empty)
 *   500     — unexpected error
 */
async function getMyBookings(req, res) {
    try {
        const bookings = await BookingService.getBookingsByUser(req.headers['x-user-id']);
        SuccessResponse.data = bookings;
        return res.status(StatusCodes.OK).json(SuccessResponse);
    } catch (error) {
        ErrorResponse.error = error;
        return res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json(ErrorResponse);
    }
}


module.exports = {
createBooking,
makePayment,
cancelUserBooking,
getMyBookings
}