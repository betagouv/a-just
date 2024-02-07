module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('ContentieuxReferentiels', 'value_quality', {
      type: Sequelize.STRING(255),
      allowNull: true,
    })

    await queryInterface.addColumn('ContentieuxReferentiels', 'help_url', {
      type: Sequelize.TEXT,
      allowNull: true,
    })
  },
  down: async (/*queryInterface /*, Sequelize*/) => {
    return
  },
}
