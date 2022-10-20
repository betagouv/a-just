module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('ContentieuxOptions', 'average_processing_time_fonc', {
      type: Sequelize.FLOAT(11),
      allowNull: true,
    })
  },
  down: async (/*queryInterface /*, Sequelize*/) => {
    return
  },
}
