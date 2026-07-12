const CrudRepository = require('./crud-repository.js');

const {Airplane} = require('../models/index.js');


class AirplaneRepository extends CrudRepository{
    constructor(){
        super(Airplane);
    }
}

module.exports = AirplaneRepository;
