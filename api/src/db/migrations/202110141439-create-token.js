module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('tokens', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      entity_id: {
        allowNull: false,
        type: Sequelize.INTEGER,
      },
      entity_name: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      token: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      type: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      consumable_until: {
        type: Sequelize.DATE,
      },
      nb_consumable: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
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

    await queryInterface.addIndex('tokens', ['entity_id'], {})
    await queryInterface.addIndex('tokens', ['entity_name'], {})
    await queryInterface.addIndex('tokens', ['token'], {})
    await queryInterface.addIndex('tokens', ['type'], {})
  },
  down: (queryInterface /*, Sequelize*/) => {
    return queryInterface.dropTable('tokens')
  },
}
