module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('HumanResources', 'juridiction', {
      type: Sequelize.STRING(255),
      allowNull: true,
    })
  },
  down: async (/*queryInterface /*, Sequelize*/) => {
    return
  },
}
