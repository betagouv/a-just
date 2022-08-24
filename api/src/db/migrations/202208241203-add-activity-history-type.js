module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('HistoriesActivitiesUpdate', 'activity_node_updated', {
      type: Sequelize.STRING,
      allowNull: true,
    })
  },
  down: async (/*queryInterface /*, Sequelize*/) => {
    return
  },
}
