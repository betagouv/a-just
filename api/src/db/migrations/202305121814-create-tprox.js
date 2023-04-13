module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('tproxs', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      tj: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      tprox: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW'),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW'),
      },
    })
  },
  down: (queryInterface /*, Sequelize*/) => {
    return queryInterface.dropTable('tproxs')
  },
}
