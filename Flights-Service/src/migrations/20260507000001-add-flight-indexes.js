'use strict';

/*
 * Migration: Add indexes to Flights table
 *
 * Problem without indexes:
 *   MySQL performs a full table scan on every flight search query.
 *   With 36,000 rows, this means reading every row to find matches.
 *
 * Indexes added:
 *
 *   1. Composite index (departureAirportId, arrivalAirportId)
 *      - Every search includes a route filter (e.g. BOM-DEL)
 *      - Composite index lets MySQL jump directly to matching rows
 *      - Order matters: put higher-cardinality or more-selective column first
 *      - departureAirportId first because queries always filter by both together
 *
 *   2. departureTime index
 *      - Date filter uses BETWEEN on this column
 *      - B-tree index allows MySQL to jump to the date range without scanning all rows
 *
 *   3. price index
 *      - Price range filter + ORDER BY price ASC both benefit from this index
 *      - MySQL can use it for both filtering and sorting in one pass
 */

module.exports = {
    async up(queryInterface, Sequelize) {
        // 1. Composite index on route columns — most selective filter in every search
        await queryInterface.addIndex('Flights', ['departureAirportId', 'arrivalAirportId'], {
            name: 'idx_flights_route'
        });

        // 2. Index on departureTime — used in date range filter (BETWEEN)
        await queryInterface.addIndex('Flights', ['departureTime'], {
            name: 'idx_flights_departure_time'
        });

        // 3. Index on price — used in price range filter and ORDER BY price
        await queryInterface.addIndex('Flights', ['price'], {
            name: 'idx_flights_price'
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeIndex('Flights', 'idx_flights_route');
        await queryInterface.removeIndex('Flights', 'idx_flights_departure_time');
        await queryInterface.removeIndex('Flights', 'idx_flights_price');
    }
};
