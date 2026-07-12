'use strict';
const { Model } = require('sequelize');
const { ENUMS } = require('../utils/common');
const { ECONOMY, PREMIUM_ECONOMY, BUSINESS, FIRST_CLASS } = ENUMS.SEAT_TYPE;

module.exports = (sequelize, DataTypes) => {
  class FlightClass extends Model {
    static associate(models) {
      this.belongsTo(models.Flight, {
        foreignKey: 'flightId',
        as: 'flight',
      });
    }
  }

  FlightClass.init({
    flightId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    seatClass: {
      type: DataTypes.ENUM,
      values: [ECONOMY, PREMIUM_ECONOMY, BUSINESS, FIRST_CLASS],
      allowNull: false,
    },
    price: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    totalSeats: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  }, {
    sequelize,
    modelName: 'FlightClass',
  });

  return FlightClass;
};
