import Sequelize from 'sequelize'

const tableName = 'Logs'

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
      code_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      datas: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      datas2: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      user_id: {
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
    },
    {
      timestamps: true,
      paranoid: true,
      underscored: true,
      tableName,
      indexes: [
        {
          unique: false,
          name: 'log-code_id-user_id',
          fields: ['code_id', 'user_id'],
        },
      ],
    }
  )

  Model.associate = function (models) {
    Model.hasOne(models.Users, { foreignKey: 'id', sourceKey: 'user_id' })

    return models
  }

  return Model
}
