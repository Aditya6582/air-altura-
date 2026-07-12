'use strict';
const { ENUMS } = require('../utils/common');
const { BUSINESS, ECONOMY, PREMIUM_ECONOMY, FIRST_CLASS } = ENUMS.SEAT_TYPE;

/** @type {import('sequelize-cli').Migration} */

// Generates all seat rows for a given airplane
// typeRules: array of { upToRow, type } applied in order — first matching rule wins
function generateSeats(airplaneId, totalRows, cols, typeRules) {
  const seats = [];
  for (let row = 1; row <= totalRows; row++) {
    const seatType = typeRules.find(rule => row <= rule.upToRow).type;
    for (const col of cols) {
      seats.push({
        row,
        col,
        airplaneId,
        type: seatType,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
  }
  return seats;
}

const NARROW_BODY = ['A', 'B', 'C', 'D', 'E', 'F'];         // 6-abreast (AIRBUS320, BOEING737)
const WIDE_BODY_9 = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I']; // 9-abreast (BOEING777)
const WIDE_BODY_10 = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']; // 10-abreast (AIRBUS380)

module.exports = {
  async up(queryInterface, Sequelize) {
    // AIRBUS320 (airplaneId: 1) — 30 rows × 6 cols = 180 seats
    const airbus320Seats = generateSeats(1, 30, NARROW_BODY, [
      { upToRow: 2,  type: FIRST_CLASS },
      { upToRow: 7,  type: BUSINESS },
      { upToRow: 12, type: PREMIUM_ECONOMY },
      { upToRow: 30, type: ECONOMY }
    ]);

    // BOEING777 (airplaneId: 2) — 44 rows × 9 cols = 396 seats
    const boeing777Seats = generateSeats(2, 44, WIDE_BODY_9, [
      { upToRow: 3,  type: FIRST_CLASS },
      { upToRow: 10, type: BUSINESS },
      { upToRow: 18, type: PREMIUM_ECONOMY },
      { upToRow: 44, type: ECONOMY }
    ]);

    // AIRBUS380 (airplaneId: 3) — 56 rows × 10 cols = 560 seats
    const airbus380Seats = generateSeats(3, 56, WIDE_BODY_10, [
      { upToRow: 4,  type: FIRST_CLASS },
      { upToRow: 12, type: BUSINESS },
      { upToRow: 22, type: PREMIUM_ECONOMY },
      { upToRow: 56, type: ECONOMY }
    ]);

    // BOEING737 (airplaneId: 4) — 27 rows × 6 cols = 162 seats
    const boeing737Seats = generateSeats(4, 27, NARROW_BODY, [
      { upToRow: 2,  type: FIRST_CLASS },
      { upToRow: 6,  type: BUSINESS },
      { upToRow: 10, type: PREMIUM_ECONOMY },
      { upToRow: 27, type: ECONOMY }
    ]);

    await queryInterface.bulkInsert('Seats', [
      ...airbus320Seats,
      ...boeing777Seats,
      ...airbus380Seats,
      ...boeing737Seats
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Seats', null, {});
  }
};
