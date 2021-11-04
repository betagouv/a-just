module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('HRFonctions', 'code', {
      type: Sequelize.STRING(255),
      allowNull: true,
    })

    await queryInterface.addColumn('HRCategories', 'rank', {
      type: Sequelize.INTEGER,
      allowNull: true,
    })
  },
  down: (/*queryInterface /*, Sequelize*/) => {
    return
  },
}
