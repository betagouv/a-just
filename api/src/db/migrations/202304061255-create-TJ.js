module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('TJ', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
        unique: true,
      },
      i_elst: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      label: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      latitude: {
        type: Sequelize.FLOAT(30, 15),
        allowNull: true,
      },
      longitude: {
        type: Sequelize.FLOAT(30, 15),
        allowNull: true,
      },
      population: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
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
    await queryInterface.dropTable('TJ')
    return
  },
}
