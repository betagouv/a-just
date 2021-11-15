module.exports = {
  up: async (queryInterface/*, Sequelize*/) => {
    await queryInterface.removeColumn('HumanResources', 'enable')
  },
  down: (/*queryInterface /*, Sequelize*/) => {
    return
  },
}
