module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('HumanResources', 'posad', {
      type: Sequelize.FLOAT,
      allowNull: true,
    })
  },
  down: (/*queryInterface /*, Sequelize*/) => {
    return
  },
}
