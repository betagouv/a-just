module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('ContentieuxOptions', 'backup_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
    })
    await queryInterface.removeColumn('ContentieuxOptions', 'juridiction_id')

    await queryInterface.createTable('OptionsBackups', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
        unique: true,
      },
      label: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      juridiction_id: {
        type: Sequelize.INTEGER,
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
