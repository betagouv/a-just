module.exports = {
  up: async (queryInterface/*, Sequelize*/) => {
    await queryInterface.renameColumn('HumanResources', 'hr_position_id', 'hr_categorie_id')
    await queryInterface.renameColumn('HumanResources', 'hr_role_id', 'hr_fonction_id')
  },
  down: (/*queryInterface /*, Sequelize*/) => {
    return
  },
}
