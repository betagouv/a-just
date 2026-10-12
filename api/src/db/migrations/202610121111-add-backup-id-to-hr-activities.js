module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('HRActivities', 'backup_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
    })
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('HRActivities', 'backup_id')
  },
}
