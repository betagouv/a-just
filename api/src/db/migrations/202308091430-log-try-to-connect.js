module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Users', 'nb_try_connection', {
      type: Sequelize.INTEGER,
      allowNull: true,
    })

    await queryInterface.addColumn('Users', 'first_try_connection', {
      type: Sequelize.DATE,
      allowNull: true,
    })
  },
  down: async (/*queryInterface /*, Sequelize*/) => {
    return
  },
}
