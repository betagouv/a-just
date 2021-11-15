module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('ContentieuxReferentiels', 'niveau_1')
    await queryInterface.removeColumn('ContentieuxReferentiels', 'niveau_2')
    await queryInterface.removeColumn('ContentieuxReferentiels', 'niveau_3')
    await queryInterface.removeColumn('ContentieuxReferentiels', 'niveau_4')
    await queryInterface.removeColumn('ContentieuxReferentiels', 'niveau_5')
    await queryInterface.removeColumn('ContentieuxReferentiels', 'niveau_6')
    await queryInterface.addColumn('ContentieuxReferentiels', 'label', {
      type: Sequelize.STRING(255),
      allowNull: true,
    })
    await queryInterface.addColumn('ContentieuxReferentiels', 'parent_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
    })
  },
  down: (/*queryInterface /*, Sequelize*/) => {
    return
  },
}
