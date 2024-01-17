module.exports = {
    up: async (queryInterface, Sequelize) => {
      await queryInterface.addColumn('HRBackups', 'jirs', {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      })
    },
    down: async (/*queryInterface /*, Sequelize*/) => {
      return
    },
  }
  