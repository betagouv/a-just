module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('humanresources', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
        unique: true,
      },
      first_name: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      last_name: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      cover_url: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      hr_position_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      hr_role_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      juridiction_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      etp: {
        type: Sequelize.FLOAT,
        allowNull: true,
      },
      enable: {
        type: Sequelize.BOOLEAN,
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
  down: (queryInterface /*, Sequelize*/) => {
    return queryInterface.dropTable('humanresources')
  },
}
