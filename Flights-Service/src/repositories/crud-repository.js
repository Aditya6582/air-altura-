const { Logger } = require('../config');
const AppError = require('../utils/errors/app-error');
const {StatusCodes} = require('http-status-codes');


class CrudRepository {
    constructor(model){
        this.model = model;
    }

    /**
     * Inserts a new row into the database table mapped to this model.
     *
     * @param {Object} data - Column values for the new record.
     * @returns {Promise<Model>} The newly created Sequelize model instance.
     */
    async create(data){
        const response = await this.model.create(data);
        return response;
    }

    /**
     * Deletes the record with the given primary key from the database.
     * Throws NOT_FOUND if no matching record exists.
     *
     * @param {number} data - Primary key (id) of the record to delete.
     * @returns {Promise<number>} Number of rows deleted (1 on success).
     */
    async destroy(data){
        const response = await this.model.destroy({
            where:{
                id: data
            }
        });
        if(!response){
            throw new AppError('Not able to find the resource',StatusCodes.NOT_FOUND);
        }
        return response;
    }

    /**
     * Fetches a single record by its primary key.
     * Throws NOT_FOUND if no matching record exists.
     *
     * @param {number} data - Primary key (id) of the record to fetch.
     * @returns {Promise<Model>} The found Sequelize model instance.
     */
    async get(data){
        const response = await this.model.findByPk(data);
        if(!response){
            throw new AppError('Not able to find a resource',StatusCodes.NOT_FOUND);
        }
        return response;
    }

    /**
     * Fetches all records from the database table mapped to this model.
     *
     * @returns {Promise<Model[]>} Array of all Sequelize model instances.
     */
    async getAll(){
        const response = await this.model.findAll();
        return response;
    }

    /**
     * Updates columns on the record matching the given id.
     * Throws NOT_FOUND if no rows were affected (i.e., id does not exist).
     *
     * @param {Object} data - Key-value pairs of columns to update.
     * @param {number} id   - Primary key of the record to update.
     * @returns {Promise<Array>} Sequelize update result array [affectedRowCount].
     */
    async update(data, id) {
        const response = await this.model.update(data, {
            where: { id: id }
        });
        if(response[0] == 0) {
            throw new AppError('Resource to be updated not found', StatusCodes.NOT_FOUND);
        }
        return response;
    }

    



}


module.exports = CrudRepository;