const { AirportService } = require('../services');
const {StatusCodes} = require('http-status-codes');
const {SuccessResponse, ErrorResponse} = require('../utils/common');


/**
 * POST /api/v1/airports
 * Creates a new airport linked to an existing city. The validateCreateRequest middleware
 * ensures name, code, and cityId are present before this handler runs.
 *
 * Request body : { name: string, code: string, address?: string, cityId: number }
 * Response 201 : { success: true, data: <Airport> }
 * Response 400 : validation failure (missing fields or duplicate name/code).
 * Response 500 : unexpected database error.
 */
async function createAirport(req,res){
    try {
        const airport = await AirportService.createAirport({
            name: req.body.name,
            code: req.body.code,
            address: req.body.address,
            cityId: req.body.cityId
        });
        SuccessResponse.data = airport;
        return res.status(
            StatusCodes.CREATED
        ).json(SuccessResponse);
    } catch (error) {
        ErrorResponse.error = error;
        return res.status(error.statusCode).json(ErrorResponse);
    }
}

/**
 * GET /api/v1/airports
 * Returns all airport records.
 *
 * Response 200: { success: true, data: <Airport[]> }
 * Response 500: unexpected database error.
 */
async function getAirports(req,res){
    try {
        const airports = await AirportService.getAirports();
        SuccessResponse.data = airports;
        res.status(StatusCodes.OK).json(SuccessResponse);
    } catch (error) {
        ErrorResponse.error = error;
        res.status(error.statusCode).json(ErrorResponse);
    }
}

/**
 * GET /api/v1/airports/:id
 * Fetches a single airport by primary key from req.params.id.
 *
 * Response 200: { success: true, data: <Airport> }
 * Response 404: airport not found.
 * Response 500: unexpected database error.
 */
async function getAirport(req,res){
    try {
        const id = req.params.id;
        const airport = await AirportService.getAirport(id);
        SuccessResponse.data = airport;
        res.status(StatusCodes.OK).json(SuccessResponse);
    } catch (error) {
        ErrorResponse.error = error;
        res.status(error.statusCode).json(ErrorResponse);
    }
}

/**
 * DELETE /api/v1/airports/:id
 * Deletes an airport by primary key. Cascades to associated Flights.
 *
 * Response 200: { success: true, data: 1 }
 * Response 404: airport not found.
 * Response 500: unexpected database error.
 */
async function destroyAirport(req,res){
    try {
        const id = req.params.id;
        const response = await AirportService.destroyAirport(id);
        SuccessResponse.data = response;
        res.status(StatusCodes.OK).json(SuccessResponse);
    } catch (error) {
        ErrorResponse.error = error;
        res.status(error.statusCode).json(ErrorResponse);
    }
}

/**
 * PATCH /api/v1/airports/:id
 * Updates the airport record identified by req.params.id with fields from req.body.
 *
 * Response 200: { success: true, data: [affectedRowCount] }
 * Response 404: airport not found.
 * Response 500: unexpected database error.
 */
async function updateAirport(req,res){
    try {
        const id = req.params.id;
        const data = req.body;
        const response = await AirportService.updateAirport(data,id);
        SuccessResponse.data = response;
        res.status(StatusCodes.OK).json(SuccessResponse);
    } catch (error) {
        ErrorResponse.error = error;
        res.status(error.statusCode).json(ErrorResponse);
    }
}

module.exports = {
    createAirport,
    getAirports,
    getAirport,
    destroyAirport,
    updateAirport
}
