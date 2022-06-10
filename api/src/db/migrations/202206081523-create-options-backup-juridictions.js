module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('OptionsBackupJuridictions', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
        unique: true,
      },
      option_backup_id: {
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
  },
  down: async (queryInterface /*, Sequelize*/) => {
    await queryInterface.dropTable('OptionsBackupJuridictions')
    return
  },
}
