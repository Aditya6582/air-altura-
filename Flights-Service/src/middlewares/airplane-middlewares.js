const {StatusCodes} = require('http-status-codes');
const {ErrorResponse} = require('../utils/common');
const AppError = require('../utils/errors/app-error');
/**
 * Middleware: validateCreateRequest (Airplanes)
 * Guards the POST /airplanes route by verifying that modelNumber is present in req.body.
 * Responds 400 BAD_REQUEST if missing; calls next() to proceed to the controller otherwise.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function validateCreateRequest(req,res,next){
    if(!req.body.modelNumber){
        ErrorResponse.message = 'Something went wrong while creating airplane';
        ErrorResponse.error = new AppError('Model Number not found in the oncoming request',StatusCodes.BAD_REQUEST)
        
        return res.status(StatusCodes.BAD_REQUEST).json(ErrorResponse);
    }
    next();
}

module.exports = {validateCreateRequest};