module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Activities', 'backup_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
    })
    await queryInterface.removeColumn('Activities', 'juridiction_id')
  },
  down: async (/*queryInterface /*, Sequelize*/) => {
    return
  },
}
