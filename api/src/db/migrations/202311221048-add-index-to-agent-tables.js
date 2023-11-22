module.exports = {
  up: async (queryInterface /*, Sequelize*/) => {
    await queryInterface.addIndex('HumanResources', ['backup_id', 'registration_number'])
    await queryInterface.addIndex('HRBackups', ['label'])
    await queryInterface.addIndex('HRCategories', ['label'])
    await queryInterface.addIndex('HRFonctions', ['code', 'category_id'])
  },
  down: async (/*queryInterface /*, Sequelize*/) => {},
}
