module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Activities', 'hr_backup_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
    })
    await queryInterface.removeColumn('Activities', 'backup_id')
  },
  down: async (/*queryInterface /*, Sequelize*/) => {
    return
  },
}
