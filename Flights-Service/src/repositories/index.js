const AirplaneRepository = require("./airplane-repository");
const CityRepository = require("./city-repository");

module.exports = {
    AirplaneRepository : require('./airplane-repository'),
    CityRepository : require('./city-repository'),
    AirportRepository : require('./airport-repository'),
    FlightRepository: require('./flight-repository')

}