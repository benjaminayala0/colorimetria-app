'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('Appointments');

    if (!tableInfo.status) {
      await queryInterface.addColumn('Appointments', 'status', {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'pending'
      });
    }

    if (!tableInfo.completedAt) {
      await queryInterface.addColumn('Appointments', 'completedAt', {
        type: Sequelize.DATE,
        allowNull: true
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('Appointments');

    if (tableInfo.completedAt) {
      await queryInterface.removeColumn('Appointments', 'completedAt');
    }

    if (tableInfo.status) {
      await queryInterface.removeColumn('Appointments', 'status');
    }
  }
};
