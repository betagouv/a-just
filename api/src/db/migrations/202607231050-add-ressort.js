module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('TJ', 'ressort', {
      type: Sequelize.STRING(255),
      allowNull: true,
    })
  },
  down: async (queryInterface) => {
  },
}
