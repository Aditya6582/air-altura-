'use strict';

/*
 * Indexes on FlightClasses:
 *
 *   1. (flightId, seatClass) — unique per flight per class, also the primary lookup
 *      when the booking service needs a specific class row for a given flight.
 *
 *   2. price — used in price range filter and ORDER BY price on FlightClasses.
 *      Replaces the old idx_flights_price that was on the Flights table.
 *
 *   3. totalSeats — used in the travellers >= N filter that moves to FlightClasses.
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addIndex('FlightClasses', ['flightId', 'seatClass'], {
      name: 'idx_flightclasses_flight_class',
      unique: true,
    });

    await queryInterface.addIndex('FlightClasses', ['price'], {
      name: 'idx_flightclasses_price',
    });

    await queryInterface.addIndex('FlightClasses', ['totalSeats'], {
      name: 'idx_flightclasses_total_seats',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('FlightClasses', 'idx_flightclasses_flight_class');
    await queryInterface.removeIndex('FlightClasses', 'idx_flightclasses_price');
    await queryInterface.removeIndex('FlightClasses', 'idx_flightclasses_total_seats');
  },
};
