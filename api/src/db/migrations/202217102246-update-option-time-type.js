module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('ContentieuxOptions', 'average_processing_time', {
      type: Sequelize.DOUBLE(11),
      allowNull: true,
    })
  },
  down: async (/*queryInterface /*, Sequelize*/) => {
    return
  },
}
