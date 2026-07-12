'use strict';
/** @type {import('sequelize-cli').Migration} */
const {ENUMS} = require('../utils/common');

const{ BOOKED,CANCELLED,INITIATED,PENDING} = ENUMS.BOOKING_STATUS
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Bookings', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      flightId: {
        type: Sequelize.INTEGER,
        allowNull:false
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull:false
      },
      status: {
        type: Sequelize.ENUM,
        allowNull:false,
        values:[BOOKED,CANCELLED,INITIATED,PENDING],
      defaultValue:INITIATED
      },
      totalCost: {
        type: Sequelize.INTEGER,
        allowNull:false
      },
      noOfSeats:{ //no of seats requested by user to be booked
        type:Sequelize.INTEGER,
        allowNull:false,
        defaultValue:1
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Bookings');
  }
};