const CrudRepository = require('./crud-repository.js');

const {City} = require('../models/index.js');


class CityRepository extends CrudRepository{
    constructor(){
        super(City);
    }
}

module.exports = CityRepository;
