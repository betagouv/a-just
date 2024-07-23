module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('OptionsBackups', 'status', {
      type: Sequelize.STRING(255),
      allowNull: true,
    })
  },
  down: async (/*queryInterface /*, Sequelize*/) => {
    return
  },
}