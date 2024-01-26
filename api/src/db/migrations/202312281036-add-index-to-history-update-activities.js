module.exports = {
  up: async (queryInterface /*, Sequelize*/) => {
    await queryInterface.addIndex('HistoriesActivitiesUpdate', ['activity_id', 'activity_node_updated'])
  },
  down: async (/*queryInterface /*, Sequelize*/) => {},
}
