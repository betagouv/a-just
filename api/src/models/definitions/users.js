import Sequelize from 'sequelize'

const tableName = 'Users'

export default (sequelizeInstance) => {
  const Model = sequelizeInstance.define(
    tableName,
    {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
        unique: true,
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: false,
      },
      password: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      new_password_token: {
        type: Sequelize.STRING(255),
        allowNull: true,
        unique: true,
      },
      role: {
        type: Sequelize.INTEGER, // 1 - ADMIN / 2 - USER
        allowNull: true,
      },
      status: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      first_name: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      last_name: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      tj: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      fonction: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      category_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      nb_try_connection: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      first_try_connection: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      referentiel_ids: {
        type: Sequelize.ARRAY(Sequelize.INTEGER),
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
    },
    {
      timestamps: true,
      paranoid: true,
      underscored: true,
      tableName,
    },
  )

  Model.associate = function (models) {
    Model.hasMany(models.UserVentilations, { foreignKey: 'user_id', sourceKey: 'id' })

    return models
  }

  return Model
}
