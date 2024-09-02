module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('OptionsBackups', 'type', {
      type: Sequelize.STRING(255),
      allowNull: true,
    })
  },
  down: async (/*queryInterface /*, Sequelize*/) => {
    return
  },
}