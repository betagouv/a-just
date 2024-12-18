module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Comments', 'hr_backup_id', {
      type: Sequelize.INTEGER,
      allowNull: false,
    })
  },
  down: async (/*queryInterface /*, Sequelize*/) => {
    return
  },
}