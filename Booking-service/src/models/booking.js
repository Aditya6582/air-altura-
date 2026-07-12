'use strict';
const {
  Model
} = require('sequelize');

const { ENUMS } = require('../utils/common');

const { BOOKED, CANCELLED, INITIATED, PENDING } = ENUMS.BOOKING_STATUS;
const { ECONOMY, PREMIUM_ECONOMY, BUSINESS, FIRST_CLASS } = ENUMS.SEAT_TYPE;

module.exports = (sequelize, DataTypes) => {
  class Booking extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Booking.init({
    flightId: {
      type:DataTypes.INTEGER,
      allowNull:false
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull:false
    },
    status: {
      type: DataTypes.ENUM,
      allowNull:false,
      values:[BOOKED,CANCELLED,INITIATED,PENDING],
      defaultValue:INITIATED
    },
    totalCost: {
      type:DataTypes.INTEGER,
      allowNull:false
    },
    noOfSeats: {
      type: DataTypes.INTEGER,
    },
    seatClass: {
      type: DataTypes.ENUM,
      values: [ECONOMY, PREMIUM_ECONOMY, BUSINESS, FIRST_CLASS],
      allowNull: true   // nullable — pre-v2 bookings have no cabin class
    }
  },
  {
    sequelize,
    modelName: 'Booking',
  });
  return Booking;
};