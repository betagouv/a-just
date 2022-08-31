module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('HistoriesActivitiesUpdate', 'value', {
      type: Sequelize.FLOAT,
      allowNull: true,
    })
  },
  down: async (/*queryInterface /*, Sequelize*/) => {
    return
  },
}
