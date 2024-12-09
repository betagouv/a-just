module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('ContentieuxReferentiels', 'only_to_hr_backup', {
      type: Sequelize.ARRAY(Sequelize.INTEGER),
      allowNull: true,
    })
  },
  down: async (/*queryInterface /*, Sequelize*/) => {
    return
  },
}