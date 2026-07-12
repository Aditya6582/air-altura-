
const { FlightRepository } = require('../repositories');

const AppError = require('../utils/errors/app-error');
const { StatusCodes } = require('http-status-codes');
const { compareTime } = require('../utils/helpers/datetime-helpers');
const { Op } = require('sequelize');
const { Redis } = require('../config');
const flightRepository = new FlightRepository();

// Search results cached for 4 hours.
// Results page shows only indicative "from" prices for discovery — seat counts
// and live prices are on FlightDetailPage which always hits the DB directly.
// The only stale "lie" is showing a possibly sold-out flight in results, which
// resolves immediately when the user clicks Select and sees the live detail page.
const CACHE_TTL = 4 * 60 * 60;

/**
 * Validates the departure/arrival times and creates a new flight record in the database.
 * When the request body contains a seatClasses array the repository creates the Flight and
 * all FlightClass rows together in one transaction (v2 path).
 * Without seatClasses the legacy single-row create is used (backward compat).
 *
 * @param {Object}  data             - Flight fields passed from the controller.
 * @param {Array}   [data.seatClasses] - Optional cabin-class array: [{ seatClass, price, totalSeats }].
 * @returns {Promise<Flight>} The newly created Flight instance.
 */
async function createFlight(data){
    try{
        if(compareTime(data.departureTime, data.arrivalTime)){
            throw new AppError('Departure time must be before arrival time', StatusCodes.BAD_REQUEST);
        }
        const flight = data.seatClasses
            ? await flightRepository.createFlightWithClasses(data)
            : await flightRepository.create(data);
        return flight;
    }catch(error){
        if(error instanceof AppError) throw error;
        if(error.name == 'SequelizeValidationError'){
            let explanation = [];
            error.errors.forEach((err) => {
                explanation.push(err.message);
            });
            throw new AppError(explanation, StatusCodes.BAD_REQUEST);
        }
        throw new AppError('Cannot Create a new Flight Object', StatusCodes.INTERNAL_SERVER_ERROR);
    }
}


/**
 * Builds dynamic WHERE and ORDER clauses from URL query parameters, then fetches matching flights.
 *
 * Filters are split into two buckets:
 *  - flightFilter : conditions applied on the Flights table (trips, tripDate).
 *  - classFilter  : conditions applied on the FlightClasses table (price, travellers/seats).
 *    When classFilter is non-empty only flights that have at least one matching FlightClass row
 *    are returned (INNER JOIN behaviour in the repository).
 *
 * Supported query params:
 *  - trips      : "BOM-DEL"           → departureAirportId / arrivalAirportId exact match.
 *  - price      : "500-2000"          → BETWEEN on FlightClasses.price; open ranges supported.
 *  - travellers : "3"                 → FlightClasses.totalSeats >= N.
 *  - tripDate   : "2026-04-15"        → Flights departing on this calendar day.
 *  - sort       : "price_ASC,departureTime_DESC" → comma-separated column_DIRECTION pairs.
 *
 * @param {Object} filters - Parsed req.query object from Express.
 * @returns {Promise<Flight[]>} Array of matching Flight instances with nested associations.
 */
async function getAllFlights(filters){
    let flightFilter = {};
    let classFilter  = {};
    let sortFilter   = [];
    const endingTripTime = "23:59:59";

    // ?trips=BOM-DEL
    if(filters.trips){
        const [departureAirportId, arrivalAirportId] = filters.trips.split("-");
        if(departureAirportId == arrivalAirportId){
            throw new AppError('Departure and arrival airport cannot be the same', StatusCodes.BAD_REQUEST);
        }
        flightFilter.departureAirportId = departureAirportId;
        flightFilter.arrivalAirportId   = arrivalAirportId;
    }

    // ?price=500-2000  |  ?price=-2000 (no lower)  |  ?price=500 (no upper)
    // Price now lives on FlightClasses — filter goes into classFilter.
    if(filters.price){
        const [minPrice, maxPrice] = filters.price.split("-");
        classFilter.price = {
            [Op.between]: [
                (minPrice == '' ? 0 : minPrice),
                (maxPrice == undefined ? 1000000 : maxPrice)
            ]
        };
    }

    // ?travellers=3 — seat count now lives on FlightClasses — filter goes into classFilter.
    if(filters.travellers){
        classFilter.totalSeats = {
            [Op.gte]: filters.travellers
        };
    }

    // ?seatClass=business — exact-match filter on the cabin type, goes into classFilter.
    // When present, only flights that have that specific cabin are returned (INNER JOIN).
    if(filters.seatClass){
        classFilter.seatClass = filters.seatClass;
    }

    // ?stopType=DIRECT | ?stopType=ONE_STOP — exact match on the Flights table ENUM.
    if(filters.stopType){
        flightFilter.stopType = filters.stopType;
    }

    // ?tripDate=2026-04-15 — departure day range filter on the Flights table.
    // Lower bound is max(start of day, now) so past flights on today's date are excluded.
    // When no tripDate is given, still filter out departed flights with a plain > now check.
    if(filters.tripDate){
        const endOfDay   = new Date(filters.tripDate + ' ' + endingTripTime);
        const startOfDay = new Date(filters.tripDate);
        const now        = new Date();
        flightFilter.departureTime = {
            [Op.between]: [startOfDay > now ? startOfDay : now, endOfDay]
        };
    } else {
        flightFilter.departureTime = { [Op.gt]: new Date() };
    }

    // ?sort=price_ASC,departureTime_DESC
    if(filters.sort){
        const params = filters.sort.split(",");
        sortFilter = params.map((param) => param.split("_"));
    }

    try {
        // Cache key: stable JSON of the full filters object so that different param orders
        // produce the same key (?trips=X&tripDate=Y == ?tripDate=Y&trips=X).
        const cacheKey = `flights:search:${JSON.stringify(filters, Object.keys(filters).sort())}`;

        try {
            const cached = await Redis.get(cacheKey);
            if(cached) return JSON.parse(cached);
        } catch {
            // Redis down — fall through to DB
        }

        const flights = await flightRepository.getAllFlights(flightFilter, classFilter, sortFilter);

        try {
            await Redis.set(cacheKey, JSON.stringify(flights), 'EX', CACHE_TTL);
        } catch {
            // Redis down — return result anyway
        }

        return flights;
    } catch(error) {
        if(error instanceof AppError) throw error;
        throw new AppError('Cannot Fetch data of all the Flights', StatusCodes.INTERNAL_SERVER_ERROR);
    }
}


/**
 * Fetches a single flight by primary key with all associations (Airplane, Airports, Cities,
 * FlightClasses, FlightStops) eager-loaded.
 * Used by the Booking Service to retrieve cabin pricing and availability before booking.
 *
 * @param {number} id - Primary key of the flight to fetch.
 * @returns {Promise<Flight>} The matching Flight instance with nested associations.
 */
async function getFlight(id){
    try {
        const flight = await flightRepository.getFlight(id);
        return flight;
    } catch(error) {
        if(error.statusCode == StatusCodes.NOT_FOUND){
            throw new AppError('The flight you requested is not present', error.statusCode);
        }
        throw new AppError('Cannot Fetch data of the flight', StatusCodes.INTERNAL_SERVER_ERROR);
    }
}

/**
 * Delegates seat count update to the repository, which handles row locking and transactions.
 * Routes to the cabin-class seat update when seatClass is present (v2 bookings), or falls back
 * to the flight-level update for backward compatibility (v1 bookings / direct calls without class).
 *
 * Called by:
 *  - Booking Service PATCH /flights/:id/seats after payment (dec=true) or cancellation (dec=false).
 *  - seat-restoration RabbitMQ subscriber on booking expiry / cancellation.
 *
 * @param {Object}  data           - Update payload.
 * @param {number}  data.flightId  - Primary key of the flight to update.
 * @param {number}  data.seats     - Number of seats to adjust.
 * @param {string}  [data.seatClass] - If present, updates FlightClasses.totalSeats for this cabin.
 * @param {boolean} [data.dec]     - true → decrement (default), false → increment.
 * @returns {Promise<Flight|FlightClass>} The updated instance reflecting the new seat count.
 */
async function updateSeats(data){
    try {
        if(data.seatClass){
            return await flightRepository.updateRemainingClassSeats(
                data.flightId,
                data.seatClass,
                data.seats,
                data.dec
            );
        }
        return await flightRepository.updateRemainingSeats(data.flightId, data.seats, data.dec);
    } catch(error) {
        if(error instanceof AppError) throw error;
        throw new AppError('Cannot update data of the flight', StatusCodes.INTERNAL_SERVER_ERROR);
    }
}



module.exports = {
    createFlight,
    getAllFlights,
    getFlight,
    updateSeats
}
