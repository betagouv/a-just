module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('HRVentilations', 'backup_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
    })

    await queryInterface.addColumn('HumanResources', 'backup_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
    })
  },
  down: (/*queryInterface /*, Sequelize*/) => {
    return
  },
}
