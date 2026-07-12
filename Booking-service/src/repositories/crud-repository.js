/*
 * CrudRepository
 *
 * Generic base class that provides standard CRUD operations for any Sequelize model.
 * All model-specific repositories extend this class and pass their model in the constructor.
 *
 * Methods provided (no transaction support — for transactional queries, override in subclass):
 *   create(data)        — INSERT a new row
 *   destroy(id)         — DELETE a row by primary key
 *   get(id)             — SELECT a single row by primary key
 *   getAll()            — SELECT all rows
 *   update(data, id)    — UPDATE a row by primary key
 *
 * Why a base class:
 *  - Avoids repeating the same findByPk / create / destroy logic across every repository
 *  - Model-specific repositories only override methods where they need custom behaviour
 *    (e.g. transaction support, custom queries, eager loading)
 */

const { Logger } = require('../config');
const AppError = require('../utils/errors/app-error');
const {StatusCodes} = require('http-status-codes');


class CrudRepository {
    constructor(model){
        // the Sequelize model this repository operates on (e.g. Booking)
        this.model = model;
    }

    /*
     * create
     * Inserts a new record. Does NOT support transactions — override in subclass if needed.
     * Receives: data object matching the model's columns
     * Returns:  the newly created Sequelize model instance
     */
    async create(data){
            const response = await this.model.create(data);
            return response;
    }

    /*
     * destroy
     * Deletes a record by primary key.
     * Receives: id (number)
     * Returns:  number of rows deleted
     * Throws:   AppError 404 if no row found with that id
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

    /*
     * get
     * Fetches a single record by primary key. Does NOT support transactions — override if needed.
     * Receives: id (number)
     * Returns:  Sequelize model instance
     * Throws:   AppError 404 if not found
     */
    async get(data){
            const response = await this.model.findByPk(data);
            if(!response){
                throw new AppError('Not able to find a resource',StatusCodes.NOT_FOUND);
            }
            return response;
    }

    /*
     * getAll
     * Fetches all records for this model with no filters.
     * Returns: array of Sequelize model instances
     */
    async getAll(){
            const response = await this.model.findAll();
            return response;
    }

    /*
     * update
     * Updates fields on a record by primary key. Does NOT support transactions — override if needed.
     * Receives: data (object of fields to update), id (number)
     * Returns:  [ affectedRows ] — Sequelize update response
     * Throws:   AppError 404 if no row was updated (id not found)
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
