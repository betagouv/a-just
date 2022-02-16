module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('HRFonctions', 'category_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
    })
  },
  down: async (/*queryInterface /*, Sequelize*/) => {
    return
  },
}
