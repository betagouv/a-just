module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('HRBackups', 'group', {
      type: Sequelize.INTEGER,
      allowNull: true,
    })
  },
  down: async (/*queryInterface /*, Sequelize*/) => {
    return
  },
}
