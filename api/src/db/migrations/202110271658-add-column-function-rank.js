module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('HRFonctions', 'rank', {
      type: Sequelize.INTEGER,
      allowNull: true,
    })
  },
  down: (/*queryInterface /*, Sequelize*/) => {
    return
  },
}
