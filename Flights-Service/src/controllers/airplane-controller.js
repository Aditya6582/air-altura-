const { AirplaneService } = require('../services');
const {StatusCodes} = require('http-status-codes');
const {SuccessResponse, ErrorResponse} = require('../utils/common');


/**
 * POST /api/v1/airplanes
 * Creates a new airplane. The validateCreateRequest middleware ensures modelNumber is present.
 *
 * Request body : { modelNumber: string, capacity?: number }
 * Response 201 : { success: true, data: <Airplane> }
 * Response 400 : validation failure (e.g., non-alphanumeric modelNumber, capacity > 1000).
 * Response 500 : unexpected database error.
 */
async function createAirplane(req,res){
    try {
        const airplane = await AirplaneService.createAirplane({
            modelNumber:req.body.modelNumber,
            capacity: req.body.capacity
        });
        SuccessResponse.data = airplane;
        return res.status(
            StatusCodes.CREATED
        ).json(SuccessResponse);
    } catch (error) {
        ErrorResponse.error = error;
        
        return res.status(error.statusCode).json(ErrorResponse);
    }

}

/**
 * GET /api/v1/airplanes
 * Returns all airplane records.
 *
 * Response 200: { success: true, data: <Airplane[]> }
 * Response 500: unexpected database error.
 */
async function getAirplanes(req,res){
    
    try {
        const airplanes = await AirplaneService.getAirplanes();
        SuccessResponse.data = airplanes;
        res.status(StatusCodes.OK).json(SuccessResponse);
    } catch (error) {
        ErrorResponse.error = error;
        res.status(error.statusCode).json(ErrorResponse);
    }
}




/**
 * GET /api/v1/airplanes/:id
 * Fetches a single airplane by primary key from req.params.id.
 *
 * Response 200: { success: true, data: <Airplane> }
 * Response 404: airplane not found.
 * Response 500: unexpected database error.
 */
async function getAirplane(req,res){
    try {
        const id = req.params.id;
        const airplane = await AirplaneService.getAirplane(id);
        SuccessResponse.data = airplane;
        res.status(StatusCodes.OK).json(SuccessResponse);
    } catch (error) {
         ErrorResponse.error = error;
        res.status(error.statusCode).json(ErrorResponse);
    }
}


/**
 * DELETE /api/v1/airplanes/:id
 * Deletes an airplane by primary key. Cascades to associated Flights and Seats.
 *
 * Response 200: { success: true, data: 1 }
 * Response 404: airplane not found.
 * Response 500: unexpected database error.
 */
async function destroyAirplane(req,res){
    try {
        const id = req.params.id;
        const response = await AirplaneService.destroyAirplane(id);
        SuccessResponse.data = response;
        res.status(StatusCodes.OK).json(SuccessResponse);
    } catch (error) {
         ErrorResponse.error = error;
        res.status(error.statusCode).json(ErrorResponse);
    }
}

/**
 * PATCH /api/v1/airplanes/:id
 * Updates the airplane record identified by req.params.id with fields from req.body.
 *
 * Response 200: { success: true, data: [affectedRowCount] }
 * Response 404: airplane not found.
 * Response 500: unexpected database error.
 */
async function updateAirplane(req,res){
    try {
        const id = req.params.id;
        const data = req.body;
        const response = await AirplaneService.updateAirplane(data,id);
        SuccessResponse.data = response;
        res.status(StatusCodes.OK).json(SuccessResponse);
    } catch (error) {
         ErrorResponse.error = error;
        res.status(error.statusCode).json(ErrorResponse);
    }
}

module.exports = {
    createAirplane,
    getAirplanes,
    getAirplane,
    destroyAirplane,
    updateAirplane
}