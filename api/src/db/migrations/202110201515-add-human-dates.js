module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('HumanResources', 'date_entree', {
      type: Sequelize.DATE,
      allowNull: true,
    })
    await queryInterface.addColumn('HumanResources', 'date_sortie', {
      type: Sequelize.DATE,
      allowNull: true,
    })

    await queryInterface.renameTable('HRRoles', 'HRFonctions')
    await queryInterface.renameTable('HRPositions', 'HRCategories')

    await queryInterface.addColumn('ContentieuxReferentiels', 'niveau_1', {
      type: Sequelize.STRING(255),
      allowNull: true,
    })
    await queryInterface.addColumn('ContentieuxReferentiels', 'niveau_2', {
      type: Sequelize.STRING(255),
      allowNull: true,
    })
    await queryInterface.addColumn('ContentieuxReferentiels', 'niveau_3', {
      type: Sequelize.STRING(255),
      allowNull: true,
    })
    await queryInterface.addColumn('ContentieuxReferentiels', 'niveau_4', {
      type: Sequelize.STRING(255),
      allowNull: true,
    })
    await queryInterface.addColumn('ContentieuxReferentiels', 'niveau_5', {
      type: Sequelize.STRING(255),
      allowNull: true,
    })
    await queryInterface.addColumn('ContentieuxReferentiels', 'niveau_6', {
      type: Sequelize.STRING(255),
      allowNull: true,
    })
    await queryInterface.removeColumn('ContentieuxReferentiels', 'code_nac')
    await queryInterface.removeColumn('ContentieuxReferentiels', 'label')
    await queryInterface.removeColumn('ContentieuxReferentiels', 'parent_id')
  },
  down: (/*queryInterface /*, Sequelize*/) => {
    return
  },
}
