module.exports = {
  up: async (queryInterface/*, Sequelize*/) => {
    await queryInterface.dropTable('Juridictions')

    await queryInterface.removeColumn('OptionsBackups', 'juridiction_id')
  },
  down: async (/*queryInterface /*, Sequelize*/) => {
    return
  },
}
