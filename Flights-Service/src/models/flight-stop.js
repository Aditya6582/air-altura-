'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class FlightStop extends Model {
    static associate(models) {
      this.belongsTo(models.Flight, {
        foreignKey: 'flightId',
        as: 'flight',
      });
    }
  }

  FlightStop.init({
    flightId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    airportCode: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    arrivalTime: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    departureTime: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    layoverMins: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  }, {
    sequelize,
    modelName: 'FlightStop',
  });

  return FlightStop;
};
