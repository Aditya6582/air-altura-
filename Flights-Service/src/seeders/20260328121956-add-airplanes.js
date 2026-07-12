'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('Airplanes', [
      { modelNumber: 'AIRBUS320', capacity: 180, createdAt: new Date(), updatedAt: new Date() },
      { modelNumber: 'BOEING777', capacity: 396, createdAt: new Date(), updatedAt: new Date() },
      { modelNumber: 'AIRBUS380', capacity: 555, createdAt: new Date(), updatedAt: new Date() },
      { modelNumber: 'BOEING737', capacity: 160, createdAt: new Date(), updatedAt: new Date() }
    ]);

    await queryInterface.bulkInsert('Cities', [
      { name: 'Mumbai',    createdAt: new Date(), updatedAt: new Date() },
      { name: 'Delhi',     createdAt: new Date(), updatedAt: new Date() },
      { name: 'Bengaluru', createdAt: new Date(), updatedAt: new Date() },
      { name: 'Chennai',   createdAt: new Date(), updatedAt: new Date() }
    ]);

    // Query IDs dynamically — avoids hardcoding cityId values that break after undo/reseed
    // because MySQL does not reset auto_increment on DELETE.
    const cities = await queryInterface.sequelize.query(
      "SELECT id, name FROM Cities WHERE name IN ('Mumbai', 'Delhi', 'Bengaluru', 'Chennai')",
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    const cityMap = {};
    for (const c of cities) cityMap[c.name] = c.id;

    await queryInterface.bulkInsert('Airports', [
      { name: 'Chhatrapati Shivaji Maharaj International Airport', code: 'BOM', address: 'Mumbai',    cityId: cityMap['Mumbai'],    createdAt: new Date(), updatedAt: new Date() },
      { name: 'Indira Gandhi International Airport',               code: 'DEL', address: 'New Delhi', cityId: cityMap['Delhi'],     createdAt: new Date(), updatedAt: new Date() },
      { name: 'Kempegowda International Airport',                  code: 'BLR', address: 'Bengaluru', cityId: cityMap['Bengaluru'], createdAt: new Date(), updatedAt: new Date() },
      { name: 'Chennai International Airport',                     code: 'MAA', address: 'Chennai',   cityId: cityMap['Chennai'],   createdAt: new Date(), updatedAt: new Date() }
    ]);

    await queryInterface.bulkInsert('Flights', [
      { flightNumber: 'AI101', airplaneId: 1, departureAirportId: 'BOM', arrivalAirportId: 'DEL', departureTime: new Date('2026-04-01T06:00:00'), arrivalTime: new Date('2026-04-01T08:10:00'), price: 3500, totalSeats: 180, createdAt: new Date(), updatedAt: new Date() },
      { flightNumber: 'AI202', airplaneId: 2, departureAirportId: 'DEL', arrivalAirportId: 'BLR', departureTime: new Date('2026-04-01T09:00:00'), arrivalTime: new Date('2026-04-01T11:30:00'), price: 4200, totalSeats: 396, createdAt: new Date(), updatedAt: new Date() },
      { flightNumber: 'AI303', airplaneId: 3, departureAirportId: 'BLR', arrivalAirportId: 'MAA', departureTime: new Date('2026-04-01T13:00:00'), arrivalTime: new Date('2026-04-01T14:10:00'), price: 2800, totalSeats: 555, createdAt: new Date(), updatedAt: new Date() },
      { flightNumber: 'AI404', airplaneId: 4, departureAirportId: 'MAA', arrivalAirportId: 'BOM', departureTime: new Date('2026-04-01T16:00:00'), arrivalTime: new Date('2026-04-01T18:20:00'), price: 3800, totalSeats: 160, createdAt: new Date(), updatedAt: new Date() }
    ]);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Flights', null, {});
    await queryInterface.bulkDelete('Airports', null, {});
    await queryInterface.bulkDelete('Cities', null, {});
    await queryInterface.bulkDelete('Airplanes', null, {});
  }
};
