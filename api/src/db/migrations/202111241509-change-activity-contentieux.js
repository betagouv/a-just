module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Activities', 'contentieux')
    await queryInterface.addColumn('Activities', 'contentieux_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
    })
  },
  down: (/*queryInterface /*, Sequelize*/) => {
    return
  },
}
