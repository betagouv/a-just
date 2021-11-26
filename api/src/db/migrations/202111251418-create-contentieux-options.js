module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('ContentieuxReferentiels', 'average_processing_time')

    await queryInterface.createTable('ContentieuxOptions', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
        unique: true,
      },
      juridiction_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      contentieux_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      average_processing_time: {
        type: Sequelize.FLOAT,
        allowNull: true,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW'),
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW'),
      },
      deleted_at: {
        type: Sequelize.DATE,
      },
    })
  },
  down: async (queryInterface /*, Sequelize*/) => {
    return queryInterface.dropTable('ContentieuxOptions')
  },
}
