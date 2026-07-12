const { FlightService } = require('../services');
const {StatusCodes} = require('http-status-codes');
const {SuccessResponse, ErrorResponse} = require('../utils/common');


/**
 * POST /api/v1/flights
 * Reads all required flight fields from req.body and delegates creation to FlightService.
 * The middleware validateCreateRequest runs before this and guarantees required fields are present.
 *
 * Request body: { flightNumber, airplaneId, departureAirportId, arrivalAirportId,
 *                 departureTime, arrivalTime, price, boardingGate, totalSeats }
 * Response 201: { success: true, data: <Flight> }
 * Response 4xx/5xx: { success: false, error: <AppError> }
 */
async function createFlight(req,res){
    try {
        const flight = await FlightService.createFlight({
            flightNumber:       req.body.flightNumber,
            airplaneId:         req.body.airplaneId,
            departureAirportId: req.body.departureAirportId,
            arrivalAirportId:   req.body.arrivalAirportId,
            arrivalTime:        req.body.arrivalTime,
            departureTime:      req.body.departureTime,
            price:              req.body.price,
            boardingGate:       req.body.boardingGate,
            totalSeats:         req.body.totalSeats,
            seatClasses:        req.body.seatClasses   // optional v2 cabin-class array
        });
        SuccessResponse.data = flight;
        return res.status(
            StatusCodes.CREATED
        ).json(SuccessResponse);
    } catch (error) {
        ErrorResponse.error = error;
        return res.status(error.statusCode).json(ErrorResponse);
    }
}

/**
 * GET /api/v1/flights
 * Passes all query parameters (trips, price, travellers, tripDate, sort) to FlightService.getAllFlights,
 * which builds dynamic WHERE/ORDER clauses before hitting the database.
 *
 * Response 200: { success: true, data: <Flight[]> }
 * Response 4xx/5xx: { success: false, error: <AppError> }
 */
async function getAllFlights(req,res){
    try {
        const flights = await FlightService.getAllFlights(req.query);
        SuccessResponse.data = flights;
        res.status(StatusCodes.OK).json(SuccessResponse);
    } catch (error) {
        ErrorResponse.error = error;
        res.status(error.statusCode).json(ErrorResponse);
    }
}


/**
 * GET /api/v1/flights/:id
 * Fetches a single flight by its primary key from req.params.id.
 * Consumed by the Booking Service to retrieve flight details before confirming a booking.
 *
 * Response 200: { success: true, data: <Flight> }
 * Response 404: flight not found.
 * Response 500: unexpected database error.
 */
async function getFlight(req,res){
    try {
        const id = req.params.id;
        const flight = await FlightService.getFlight(id);
        SuccessResponse.data = flight;
        res.status(StatusCodes.OK).json(SuccessResponse);
    } catch (error) {
         ErrorResponse.error = error;
        res.status(error.statusCode).json(ErrorResponse);
    }
}

/**
 * PATCH /api/v1/flights/:id/seats
 * Adjusts the totalSeats count on a flight — called by the Booking Service after payment
 * (dec=true to book seats) or after cancellation (dec=false to release seats).
 * Uses a row-level DB lock internally to prevent race conditions.
 *
 * Request body : { seats: <number>, dec?: <boolean> }
 * Response 200 : { success: true, data: <updated Flight> }
 * Response 400 : seats field missing (caught by validateUpdateSeatsRequest middleware).
 * Response 500 : unexpected database error.
 */
async function updateSeats(req,res){
    try {
        const response = await FlightService.updateSeats({
            flightId:  req.params.id,
            seats:     req.body.seats,
            dec:       req.body.dec,
            seatClass: req.body.seatClass   // routes to class-level seat update when present
        });
        SuccessResponse.data= response;
        return res.status(StatusCodes.OK).json(SuccessResponse)
    } catch (error) {
        ErrorResponse.error = error;
        return res.status(error.statusCode).json(ErrorResponse);
    }

}

module.exports = {
    createFlight,
    getAllFlights,
    getFlight,
    updateSeats
}
