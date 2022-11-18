module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Users', 'tj', {
      type: Sequelize.STRING(255),
      allowNull: true,
    })

    await queryInterface.addColumn('Users', 'fonction', {
      type: Sequelize.STRING(255),
      allowNull: true,
    })
  },
  down: async (/*queryInterface /*, Sequelize*/) => {
    return
  },
}
