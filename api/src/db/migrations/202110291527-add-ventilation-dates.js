module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('HRVentilations', 'date_start', {
      type: Sequelize.DATE,
      allowNull: true,
    })
    await queryInterface.addColumn('HRVentilations', 'date_stop', {
      type: Sequelize.DATE,
      allowNull: true,
    })
  },
  down: (/*queryInterface /*, Sequelize*/) => {
    return
  },
}
