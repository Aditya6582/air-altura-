
const { AirplaneRepository} = require('../repositories');

const AppError = require('../utils/errors/app-error');
const {StatusCodes} = require('http-status-codes');

const airplaneRepository = new AirplaneRepository();

/**
 * Creates a new airplane record in the database.
 * On SequelizeValidationError, collects all field-level messages and throws 400 BAD_REQUEST.
 * Throws 500 INTERNAL_SERVER_ERROR for unexpected failures.
 *
 * @param {Object} data              - Airplane fields.
 * @param {string} data.modelNumber  - Alphanumeric model identifier (e.g., "airbus320").
 * @param {number} [data.capacity]   - Seat capacity (max 1000, defaults to 0).
 * @returns {Promise<Airplane>} The newly created Airplane instance.
 */
async function createAirplane(data){
    try{
        const airplane = await airplaneRepository.create(data);
        return airplane;
    }catch(error){
        if(error.name == 'SequelizeValidationError'){
            let explanation = [];
            
            error.errors.forEach((err)=>{
                explanation.push(err.message);
            });
            throw new AppError(explanation, StatusCodes.BAD_REQUEST);
        }
        throw new AppError('Cannot Create a new Airplane Object',StatusCodes.INTERNAL_SERVER_ERROR );
    }
}

/**
 * Fetches all airplane records from the database.
 * Throws 500 INTERNAL_SERVER_ERROR if the query fails.
 *
 * @returns {Promise<Airplane[]>} Array of all Airplane instances.
 */
async function getAirplanes(){
    try {
        const airplanes = await airplaneRepository.getAll();

        return airplanes;
    } catch (error) {

        throw new AppError('Cannot Fetch data of all the Airplanes',StatusCodes.INTERNAL_SERVER_ERROR );
    }
}

/**
 * Fetches a single airplane by its primary key.
 * Throws 404 NOT_FOUND if the airplane does not exist.
 * Throws 500 INTERNAL_SERVER_ERROR for unexpected failures.
 *
 * @param {number} id - Primary key of the airplane to fetch.
 * @returns {Promise<Airplane>} The matching Airplane instance.
 */
async function getAirplane(id){
    try {
        const airplane = await airplaneRepository.get(id);

        return airplane;
    } catch (error) {
        if(error.statusCode == StatusCodes.NOT_FOUND){
            throw new AppError('The airplane you requested is not present', error.statusCode);
        }
        throw new AppError('Cannot Fetch data of all the Airplanes',StatusCodes.INTERNAL_SERVER_ERROR );
    }
}

/**
 * Deletes an airplane record by its primary key.
 * Due to CASCADE rules, deleting an airplane also deletes its associated Flights and Seats.
 * Throws 404 NOT_FOUND if the airplane does not exist.
 * Throws 500 INTERNAL_SERVER_ERROR for unexpected failures.
 *
 * @param {number} id - Primary key of the airplane to delete.
 * @returns {Promise<number>} Number of rows deleted (1 on success).
 */
async function destroyAirplane(id){
      try {
        const response = await airplaneRepository.destroy(id);
        return response;
    } catch (error) {
        if(error.statusCode == StatusCodes.NOT_FOUND){
            throw new AppError('The airplane you requested to delete is not present', error.statusCode);
        }
        throw new AppError('Unable to delete the airplane',StatusCodes.INTERNAL_SERVER_ERROR );
    }
}

/**
 * Updates an airplane record identified by the given id.
 * Throws 404 NOT_FOUND if no matching airplane exists.
 * Throws 500 INTERNAL_SERVER_ERROR for unexpected failures.
 *
 * @param {Object} data - Fields to update (e.g., { capacity: 180 }).
 * @param {number} id   - Primary key of the airplane to update.
 * @returns {Promise<Array>} Sequelize update result [affectedRowCount].
 */
async function updateAirplane(data,id){
    try {
        const response = await airplaneRepository.update(data,id);
        return response;
    } catch (error) {
        if(error.statusCode == StatusCodes.NOT_FOUND){
            throw new AppError('Airplane to be updated was not found',error.statusCode);
        }
        throw new AppError('Unable to update the airplane',StatusCodes.INTERNAL_SERVER_ERROR);

    }
}







module.exports = {
    createAirplane,
    getAirplanes,
    getAirplane,
    destroyAirplane,
    updateAirplane
}