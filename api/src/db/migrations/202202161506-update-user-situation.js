module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('HRSituations', 'category_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
    })
    await queryInterface.changeColumn('HRSituations', 'fonction_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
    })
  },
  down: async (/*queryInterface /*, Sequelize*/) => {
    return
  },
}
