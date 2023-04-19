module.exports = {
  up: async (queryInterface /*, Sequelize*/) => {
    await queryInterface.dropTable('tproxs')
  },
  down: (/*queryInterface /*, Sequelize*/) => {
    //return queryInterface.dropTable('tproxs')
  },
}
