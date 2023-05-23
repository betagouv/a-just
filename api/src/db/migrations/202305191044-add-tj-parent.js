module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('TJ', 'type', {
      type: Sequelize.STRING(255),
      allowNull: true,
    })

    await queryInterface.addColumn('TJ', 'parent_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
    })
  },
  down: async (/*queryInterface /*, Sequelize*/) => {
    return
  },
}
