module.exports = {
  up: async (queryInterface/*, Sequelize*/) => {
    await queryInterface.renameTable('humanresources', 'HumanResources')
    await queryInterface.renameTable('users', 'Users')
  },
  down: async (/*queryInterface /*, Sequelize*/) => {
  },
}
