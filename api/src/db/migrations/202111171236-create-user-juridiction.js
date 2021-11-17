module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('UserJuridictions', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
        unique: true,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      juridiction_id: {
        type: Sequelize.INTEGER,
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

    await queryInterface.addColumn('HRBackups', 'juridiction_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
    })
  },
  down: async (queryInterface /*, Sequelize*/) => {
    return queryInterface.dropTable('UserJuridictions')
  },
}
