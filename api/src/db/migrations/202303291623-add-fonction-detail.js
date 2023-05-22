module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('HRFonctions', 'category_detail', {
      type: Sequelize.STRING(255),
      allowNull: true,
    })
  },
  down: async (/*queryInterface /*, Sequelize*/) => {
    return
  },
}
