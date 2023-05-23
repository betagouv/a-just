module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('ContentieuxReferentiels', 'rank', {
      type: Sequelize.INTEGER,
      allowNull: true,
    })
  },
  down: async (/*queryInterface /*, Sequelize*/) => {
    return
  },
}
