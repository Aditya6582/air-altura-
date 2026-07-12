const { CityRepository} = require('../repositories');

const AppError = require('../utils/errors/app-error');
const {StatusCodes} = require('http-status-codes');

const cityRepository = new CityRepository();

/**
 * Creates a new city record in the database.
 * City names are unique; a duplicate name triggers a SequelizeUniqueConstraintError → 400 BAD_REQUEST.
 * Other validation errors are also collected and returned as 400 BAD_REQUEST.
 * Throws 500 INTERNAL_SERVER_ERROR for unexpected failures.
 *
 * @param {Object} data       - City fields.
 * @param {string} data.name  - Name of the city (must be unique, e.g., "Mumbai").
 * @returns {Promise<City>} The newly created City instance.
 */
async function createCity(data) {
     try{
        const city = await cityRepository.create(data);
        return city;
    }catch(error){
        if(error.name == 'SequelizeValidationError' || error.name == 'SequelizeUniqueConstraintError'){

            let explanation = [];
            
            error.errors.forEach((err)=>{
                explanation.push(err.message);
            });
            throw new AppError(explanation, StatusCodes.BAD_REQUEST);
        }
        throw new AppError('Cannot Create a new City Object',StatusCodes.INTERNAL_SERVER_ERROR );
    }
}


/**
 * Deletes a city record by its primary key.
 * Throws 404 NOT_FOUND if the city does not exist.
 * Throws 500 INTERNAL_SERVER_ERROR for unexpected failures.
 *
 * @param {number} id - Primary key of the city to delete.
 * @returns {Promise<number>} Number of rows deleted (1 on success).
 */
async function destroyCity(id){
      try {
        const response = await cityRepository.destroy(id);
        return response;
    } catch (error) {
        if(error.statusCode == StatusCodes.NOT_FOUND){
            throw new AppError('The city you requested to delete is not present', error.statusCode);
        }
        throw new AppError('Unable to delete the City ',StatusCodes.INTERNAL_SERVER_ERROR );
    }
}

/**
 * Updates a city record identified by the given id.
 * Throws 404 NOT_FOUND if no matching city exists.
 * Throws 500 INTERNAL_SERVER_ERROR for unexpected failures.
 *
 * @param {Object} data       - Fields to update (e.g., { name: 'New City Name' }).
 * @param {number} id         - Primary key of the city to update.
 * @returns {Promise<Array>} Sequelize update result [affectedRowCount].
 */
async function updateCity(data,id){
    try {
        const response = await cityRepository.update(data,id);
        return response;
    } catch (error) {
        if(error.statusCode == StatusCodes.NOT_FOUND){
            throw new AppError('City to be updated was not found',error.statusCode);
        }
        throw new AppError('Unable to update the City',StatusCodes.INTERNAL_SERVER_ERROR);

    }
}



module.exports = {
createCity,
updateCity,
destroyCity
}