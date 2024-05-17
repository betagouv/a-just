module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.renameColumn('ContentieuxReferentiels', 'value_quality', 'value_quality_in')

    await queryInterface.addColumn('ContentieuxReferentiels', 'value_quality_out', {
      type: Sequelize.STRING(255),
      allowNull: true,
    })

    await queryInterface.addColumn('ContentieuxReferentiels', 'value_quality_stock', {
      type: Sequelize.STRING(255),
      allowNull: true,
    })
  },
  down: async (/*queryInterface /*, Sequelize*/) => {
    return
  },
}
