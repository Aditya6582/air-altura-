const {StatusCodes} = require('http-status-codes');
const {ErrorResponse} = require('../utils/common');
const AppError = require('../utils/errors/app-error');
/**
 * Middleware: validateCreateRequest (Flights)
 * Guards the POST /flights route by checking that all required fields are present in req.body.
 *
 * Two valid shapes:
 *  - v2 (preferred): seatClasses array present — price and totalSeats are derived from it.
 *  - v1 (legacy):    price and totalSeats present directly on the body.
 *
 * Required in both cases: flightNumber, airplaneId, departureAirportId, arrivalAirportId,
 *                         arrivalTime, departureTime.
 * Responds 400 BAD_REQUEST immediately with a descriptive message if any field is missing.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function validateCreateRequest(req, res, next){
    if(!req.body.flightNumber){
        ErrorResponse.message = 'Something went wrong while creating flight';
        ErrorResponse.error = new AppError('Flight number not found in the oncoming request', StatusCodes.BAD_REQUEST);
        return res.status(StatusCodes.BAD_REQUEST).json(ErrorResponse);
    }
    if(!req.body.airplaneId){
        ErrorResponse.message = 'Something went wrong while creating flight';
        ErrorResponse.error = new AppError('Airplane ID not found in the oncoming request', StatusCodes.BAD_REQUEST);
        return res.status(StatusCodes.BAD_REQUEST).json(ErrorResponse);
    }
    if(!req.body.departureAirportId){
        ErrorResponse.message = 'Something went wrong while creating flight';
        ErrorResponse.error = new AppError('Departure airport ID not found in the oncoming request', StatusCodes.BAD_REQUEST);
        return res.status(StatusCodes.BAD_REQUEST).json(ErrorResponse);
    }
    if(!req.body.arrivalAirportId){
        ErrorResponse.message = 'Something went wrong while creating flight';
        ErrorResponse.error = new AppError('Arrival airport ID not found in the oncoming request', StatusCodes.BAD_REQUEST);
        return res.status(StatusCodes.BAD_REQUEST).json(ErrorResponse);
    }
    if(!req.body.arrivalTime){
        ErrorResponse.message = 'Something went wrong while creating flight';
        ErrorResponse.error = new AppError('Arrival time not found in the oncoming request', StatusCodes.BAD_REQUEST);
        return res.status(StatusCodes.BAD_REQUEST).json(ErrorResponse);
    }
    if(!req.body.departureTime){
        ErrorResponse.message = 'Something went wrong while creating flight';
        ErrorResponse.error = new AppError('Departure time not found in the oncoming request', StatusCodes.BAD_REQUEST);
        return res.status(StatusCodes.BAD_REQUEST).json(ErrorResponse);
    }
    // v2 path: seatClasses array satisfies both price and seat-count requirements
    const hasSeatClasses = Array.isArray(req.body.seatClasses) && req.body.seatClasses.length > 0;
    if(!hasSeatClasses){
        if(!req.body.price){
            ErrorResponse.message = 'Something went wrong while creating flight';
            ErrorResponse.error = new AppError('Price (or seatClasses) not found in the oncoming request', StatusCodes.BAD_REQUEST);
            return res.status(StatusCodes.BAD_REQUEST).json(ErrorResponse);
        }
        if(!req.body.totalSeats){
            ErrorResponse.message = 'Something went wrong while creating flight';
            ErrorResponse.error = new AppError('Total seats (or seatClasses) not found in the oncoming request', StatusCodes.BAD_REQUEST);
            return res.status(StatusCodes.BAD_REQUEST).json(ErrorResponse);
        }
    }
    next();
}


/**
 * Middleware: validateUpdateSeatsRequest (Flights)
 * Guards the PATCH /flights/:id/seats route by ensuring `seats` is present in req.body.
 * Responds 400 BAD_REQUEST if the field is missing; calls next() otherwise.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function validateUpdateSeatsRequest(req,res,next){
  
    if(!req.body.seats){
        ErrorResponse.message = 'Something went wrong while updating flight';
        ErrorResponse.error = new AppError('seats not found in the oncoming request',StatusCodes.BAD_REQUEST)
        return res.status(StatusCodes.BAD_REQUEST).json(ErrorResponse);
    }

    next();
}



module.exports = {validateCreateRequest,validateUpdateSeatsRequest};