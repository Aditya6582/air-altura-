/*
 * AppError
 *
 * Custom error class that extends the native Error.
 * Used throughout the service layer to throw errors with an HTTP status code attached,
 * so that controllers can send the correct HTTP response without any extra logic.
 *
 * Why extend Error:
 *  - Allows instanceof checks
 *  - Works naturally with try/catch
 *  - Adds statusCode so the controller doesn't have to decide what status to send
 *
 * Properties:
 *   message     — inherited from Error, human-readable error description
 *   statusCode  — HTTP status code (e.g. 400, 404, 500)
 *   explanation — same as message, explicit field for JSON serialization in responses
 *
 * Usage:
 *   throw new AppError('Not enough seats available', StatusCodes.BAD_REQUEST)
 */

const { StatusCodes } = require("http-status-codes");

class AppError extends Error{
    constructor(message,statusCode){
        super(message);
        this.statusCode = statusCode;
        this.explanation = message; // explicit field so it appears in JSON error responses
    }
}
module.exports = AppError;
