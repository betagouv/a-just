module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Activities', 'original_entrees', {
      type: Sequelize.INTEGER,
      allowNull: true,
    })
    
    await queryInterface.changeColumn('Activities', 'entrees', {
      type: Sequelize.INTEGER,
      allowNull: true,
    })

    await queryInterface.addColumn('Activities', 'original_sorties', {
      type: Sequelize.INTEGER,
      allowNull: true,
    })

    await queryInterface.changeColumn('Activities', 'sorties', {
      type: Sequelize.INTEGER,
      allowNull: true,
    })

    await queryInterface.addColumn('Activities', 'original_stock', {
      type: Sequelize.INTEGER,
      allowNull: true,
    })

    await queryInterface.changeColumn('Activities', 'stock', {
      type: Sequelize.INTEGER,
      allowNull: true,
    })
  },
  down: async (/*queryInterface /*, Sequelize*/) => {
    return
  },
}
