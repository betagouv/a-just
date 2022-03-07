module.exports = {
  up: async (queryInterface/*, Sequelize*/) => {
    await queryInterface.removeColumn('HumanResources', 'hr_categorie_id')
    await queryInterface.removeColumn('HumanResources', 'hr_fonction_id')
    await queryInterface.removeColumn('HumanResources', 'juridiction_id')
    await queryInterface.removeColumn('HumanResources', 'etp')
    await queryInterface.removeColumn('HumanResources', 'posad')
    await queryInterface.removeColumn('HumanResources', 'note')
  },
  down: async (/*queryInterface /*, Sequelize*/) => {
    return
  },
}
