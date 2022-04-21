module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('ContentieuxReferentiels', 'code_import', {
      type: Sequelize.STRING(255),
      allowNull: true,
    })
  },
  down: async (/*queryInterface /*, Sequelize*/) => {
    return
  },
}
