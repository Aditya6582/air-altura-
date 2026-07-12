
const { AirportRepository} = require('../repositories');

const AppError = require('../utils/errors/app-error');
const {StatusCodes} = require('http-status-codes');

const airportRepository = new AirportRepository();

/**
 * Creates a new airport record in the database.
 * On SequelizeValidationError, collects all field-level messages and throws 400 BAD_REQUEST.
 * Throws 500 INTERNAL_SERVER_ERROR for unexpected failures.
 *
 * @param {Object} data          - Airport fields.
 * @param {string} data.name     - Full airport name (must be unique, e.g., "Indira Gandhi International").
 * @param {string} data.code     - IATA airport code (must be unique, e.g., "DEL").
 * @param {string} [data.address]- Physical address of the airport.
 * @param {number} data.cityId   - Foreign key linking the airport to its city.
 * @returns {Promise<Airport>} The newly created Airport instance.
 */
async function createAirport(data){
    try{
        const airport = await airportRepository.create(data);
        return airport;
    }catch(error){
        if(error.name == 'SequelizeValidationError'){
            let explanation = [];
            
            error.errors.forEach((err)=>{
                explanation.push(err.message);
            });
            throw new AppError(explanation, StatusCodes.BAD_REQUEST);
        }
        throw new AppError('Cannot Create a new Airport Object',StatusCodes.INTERNAL_SERVER_ERROR );
    }
}

/**
 * Fetches all airport records from the database.
 * Throws 500 INTERNAL_SERVER_ERROR if the query fails.
 *
 * @returns {Promise<Airport[]>} Array of all Airport instances.
 */
async function getAirports(){
    try {
        const airport = await airportRepository.getAll();

        return airport;
    } catch (error) {

        throw new AppError('Cannot Fetch data of all the Airports',StatusCodes.INTERNAL_SERVER_ERROR );
    }
}

/**
 * Fetches a single airport by its primary key.
 * Throws 404 NOT_FOUND if the airport does not exist.
 * Throws 500 INTERNAL_SERVER_ERROR for unexpected failures.
 *
 * @param {number} id - Primary key of the airport to fetch.
 * @returns {Promise<Airport>} The matching Airport instance.
 */
async function getAirport(id){
    try {
        const airport = await airportRepository.get(id);

        return airport;
    } catch (error) {
        if(error.statusCode == StatusCodes.NOT_FOUND){
            throw new AppError('The airport you requested is not present', error.statusCode);
        }
        throw new AppError('Cannot Fetch data of the Airport',StatusCodes.INTERNAL_SERVER_ERROR );
    }
}

/**
 * Deletes an airport record by its primary key.
 * Due to CASCADE rules, deleting an airport also deletes its associated Flights.
 * Throws 404 NOT_FOUND if the airport does not exist.
 * Throws 500 INTERNAL_SERVER_ERROR for unexpected failures.
 *
 * @param {number} id - Primary key of the airport to delete.
 * @returns {Promise<number>} Number of rows deleted (1 on success).
 */
async function destroyAirport(id){
      try {
        const response = await airportRepository.destroy(id);
        return response;
    } catch (error) {
        if(error.statusCode == StatusCodes.NOT_FOUND){
            throw new AppError('The airport you requested to delete is not present', error.statusCode);
        }
        throw new AppError('Unable to delete the airport',StatusCodes.INTERNAL_SERVER_ERROR );
    }
}

/**
 * Updates an airport record identified by the given id.
 * Throws 404 NOT_FOUND if no matching airport exists.
 * Throws 500 INTERNAL_SERVER_ERROR for unexpected failures.
 *
 * @param {Object} data - Fields to update (e.g., { name: 'New Name', address: '...' }).
 * @param {number} id   - Primary key of the airport to update.
 * @returns {Promise<Array>} Sequelize update result [affectedRowCount].
 */
async function updateAirport(data,id){
    try {
        const response = await airportRepository.update(data,id);
        return response;
    } catch (error) {
        if(error.statusCode == StatusCodes.NOT_FOUND){
            throw new AppError('Airport to be updated was not found',error.statusCode);
        }
        throw new AppError('Unable to update the airport',StatusCodes.INTERNAL_SERVER_ERROR);

    }
}







module.exports = {
    createAirport,
    getAirport,
    getAirports,
    destroyAirport,
    updateAirport
}