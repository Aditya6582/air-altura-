'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Flights', 'stopType', {
      type: Sequelize.ENUM('DIRECT', 'ONE_STOP'),
      allowNull: false,
      defaultValue: 'DIRECT',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Flights', 'stopType');
    await queryInterface.sequelize.query("DROP TYPE IF EXISTS `enum_Flights_stopType`;");
  },
};
