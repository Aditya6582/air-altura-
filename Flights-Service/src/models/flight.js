'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Flight extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.belongsTo(models.Airplane,{
        foreignKey:'airplaneId',
        as:'airplaneDetails'
      });

      this.belongsTo(models.Airport,{
        foreignKey: 'departureAirportId',
        targetKey: 'code',
        as:'departureAirport'
      });

      this.belongsTo(models.Airport,{
        foreignKey: 'arrivalAirportId',
        targetKey: 'code',
        as: 'arrivalAirport'
      });

      this.hasMany(models.FlightClass, {
        foreignKey: 'flightId',
        as: 'FlightClasses',
        onDelete: 'CASCADE',
      });

      this.hasMany(models.FlightStop, {
        foreignKey: 'flightId',
        as: 'FlightStops',
        onDelete: 'CASCADE',
      });
    }
  }
  Flight.init({
    flightNumber:{ type:DataTypes.STRING,
      allowNull:false
    },
    airplaneId: {type:DataTypes.INTEGER,
      allowNull:false
    },
    departureAirportId: {type:DataTypes.STRING,
      allowNull:false
    },
    arrivalAirportId: {type:DataTypes.STRING,
      allowNull:false
    },
    arrivalTime: {type:DataTypes.DATE,
      allowNull:false
    },
    departureTime: {type:DataTypes.DATE,
      allowNull:false
    },
    price: {type:DataTypes.INTEGER,
      allowNull:false
    },
    boardingGate: { type:DataTypes.STRING},
    totalSeats: {type:DataTypes.INTEGER,//total available seats — kept for backward compat during migration, removed in Stage 6
      allowNull:false
    },
    stopType: {
      type: DataTypes.ENUM,
      values: ['DIRECT', 'ONE_STOP'],
      allowNull: false,
      defaultValue: 'DIRECT',
    }
  }, {
    sequelize,
    modelName: 'Flight',
  });
  return Flight;
};