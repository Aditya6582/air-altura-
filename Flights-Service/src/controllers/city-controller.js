const { CityService } = require('../services');
const {StatusCodes} = require('http-status-codes');
const {SuccessResponse, ErrorResponse} = require('../utils/common');


/**
 * POST /api/v1/cities
 * Creates a new city. The validateCreateRequest middleware ensures name is present.
 * City names are unique — duplicate names return 400 BAD_REQUEST.
 *
 * Request body : { name: string }
 * Response 201 : { success: true, data: <City> }
 * Response 400 : missing name or duplicate city name.
 * Response 500 : unexpected database error.
 */
async function createCity(req,res){
    try {
        const city = await CityService.createCity({
            name: req.body.name
        });
        SuccessResponse.data = city;
        return res.status(
            StatusCodes.CREATED
        ).json(SuccessResponse);
    } catch (error) {
        ErrorResponse.error = error;
        
        return res.status(error.statusCode).json(ErrorResponse);
    }

}


/**
 * DELETE /api/v1/cities/:id
 * Deletes a city by primary key from req.params.id.
 *
 * Response 200: { success: true, data: 1 }
 * Response 404: city not found.
 * Response 500: unexpected database error.
 */
async function destroyCity(req,res){
    try {
        const id = req.params.id;
        const response = await CityService.destroyCity(id);
        SuccessResponse.data = response;
        res.status(StatusCodes.OK).json(SuccessResponse);
    } catch (error) {
         ErrorResponse.error = error;
        res.status(error.statusCode).json(ErrorResponse);
    }
}

/**
 * PATCH /api/v1/cities/:id
 * Updates the city record identified by req.params.id with fields from req.body.
 *
 * Response 200: { success: true, data: [affectedRowCount] }
 * Response 404: city not found.
 * Response 500: unexpected database error.
 */
async function updateCity(req,res){
    try {
        const id = req.params.id;
        const data = req.body;
        const response = await CityService.updateCity(data,id);
        SuccessResponse.data = response;
        res.status(StatusCodes.OK).json(SuccessResponse);
    } catch (error) {
         ErrorResponse.error = error;
        res.status(error.statusCode).json(ErrorResponse);
    }
}
module.exports = {
    createCity,
    destroyCity,
    updateCity
}