'use strict';
const {
  Model
} = require('sequelize');
const {ENUMS} = require('../utils/common')
const {BUSINESS,ECONOMY,PREMIUM_ECONOMY,FIRST_CLASS} = ENUMS.SEAT_TYPE;
module.exports = (sequelize, DataTypes) => {
  class Seat extends Model {
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
    }
  }
  Seat.init({
    row: {
      type:DataTypes.INTEGER,
      allowNull: false
    },
    col: {
      type:DataTypes.STRING,
      allowNull:false
    }
      ,
    airplaneId: {
      type:DataTypes.INTEGER,
      allowNull:false
    },
    type: {
      type:DataTypes.ENUM, //only 4 types are there so enum better to use than string
      values:[BUSINESS,ECONOMY,PREMIUM_ECONOMY,FIRST_CLASS],
      defaultValue:ECONOMY,
      allowNull:false
    }
  }, {
    sequelize,
    modelName: 'Seat',
  });
  return Seat;
};