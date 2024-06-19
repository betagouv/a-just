import Sequelize from 'sequelize'

const tableName = 'HRComments'

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
      human_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      comment: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      user_id: {
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
    },
    {
      timestamps: true,
      paranoid: true,
      underscored: true,
      tableName,
      indexes: [
        {
          unique: false,
          name: 'hr-comments-human_id',
          fields: ['human_id'],
        },
      ],
    }
  )

  Model.associate = function (models) {
    Model.hasOne(models.HumanResources, { foreignKey: 'id', sourceKey: 'human_id' })
    Model.hasOne(models.Users, { foreignKey: 'id', sourceKey: 'user_id' })
    return models
  }

  return Model
}
