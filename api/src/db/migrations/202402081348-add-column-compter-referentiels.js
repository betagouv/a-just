module.exports = {
    up: async (queryInterface, Sequelize) => {
      await queryInterface.addColumn('ContentieuxReferentiels', 'compter', {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: true,
      })
    },
    down: async (/*queryInterface /*, Sequelize*/) => {
      return
    },
  }