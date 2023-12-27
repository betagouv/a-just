module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('Users', 'email', {
      type: Sequelize.STRING(255),
      allowNull: false,
      unique: false,
    })
  },
  down: async (/*queryInterface /*, Sequelize*/) => {
    return
  },
}
