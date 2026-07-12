const { StatusCodes } = require("http-status-codes");

/**
 * Custom application error that extends the native Error class.
 * Carries an HTTP status code alongside the message so controllers can
 * send the correct HTTP response without extra if/else logic.
 *
 * Usage:
 *   throw new AppError('Flight not found', StatusCodes.NOT_FOUND);
 *
 * The `explanation` field mirrors `message` and is serialised into the
 * ErrorResponse.error object sent to API consumers.
 *
 * @param {string|string[]} message   - Human-readable description, or array of validation messages.
 * @param {number}          statusCode - HTTP status code (400, 404, 500, etc.).
 */
class AppError extends Error{
    constructor(message,statusCode){
        super(message);
        this.statusCode = statusCode;
        this.explanation = message;
    }
}
module.exports = AppError;