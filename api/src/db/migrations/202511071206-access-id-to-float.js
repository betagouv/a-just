module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('UsersAccess', 'access_id', {
      type: Sequelize.FLOAT,
      allowNull: false,
    })
    await queryInterface.changeColumn('tokens', 'token', {
      type: Sequelize.TEXT,
      allowNull: false,
      unique: true,
    })
  },
  down: async (/*queryInterface /*, Sequelize*/) => {
    return
  },
}
