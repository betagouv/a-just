module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('HumanResources', 'registration_number', {
      type: Sequelize.STRING(255),
      allowNull: true,
    })
  },
  down: (/*queryInterface /*, Sequelize*/) => {
    return
  },
}
