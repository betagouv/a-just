module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Logs', 'datas2', {
      type: Sequelize.TEXT,
      allowNull: true,
    })
  },
  down: async (/*queryInterface /*, Sequelize*/) => {
    return
  },
}
