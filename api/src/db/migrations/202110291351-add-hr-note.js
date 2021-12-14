module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('HumanResources', 'note', {
      type: Sequelize.TEXT,
      allowNull: true,
    })
  },
  down: (/*queryInterface /*, Sequelize*/) => {
    return
  },
}
