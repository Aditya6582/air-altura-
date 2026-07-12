'use strict';

const { ENUMS } = require('../utils/common');
const { ECONOMY, PREMIUM_ECONOMY, BUSINESS, FIRST_CLASS } = ENUMS.SEAT_TYPE;

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('Bookings', 'seatClass', {
            type: Sequelize.ENUM,
            values: [ECONOMY, PREMIUM_ECONOMY, BUSINESS, FIRST_CLASS],
            allowNull: true,  // nullable — existing rows pre-v2 have no cabin class recorded
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('Bookings', 'seatClass');
    }
};
