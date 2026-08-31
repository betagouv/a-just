module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Groups', {
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

    await queryInterface.addIndex('Groups', ['label'])

    await queryInterface.addColumn('HRBackups', 'group_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
    })
    await queryInterface.addColumn('HRBackups', 'group_id_rank', {
      type: Sequelize.INTEGER,
      allowNull: true,
    })
  },
  down: async (queryInterface /*, Sequelize*/) => {
    await queryInterface.dropTable('Groups')
    await queryInterface.removeColumn('HRBackups', 'group_id_rank')
    return queryInterface.removeColumn('HRBackups', 'group_id')
  },
}
