import Sequelize from 'sequelize'

const tableName = 'HistoriesActivitiesUpdate'

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
      activity_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      activity_node_updated: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      value: {
        type: Sequelize.FLOAT,
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
          name: 'histories-activities-update-activity_id-activity_node_updated',
          fields: ['activity_id', 'activity_node_updated'],
        },
      ],
    }
  )

  Model.associate = function (models) {
    Model.hasOne(models.Users, { foreignKey: 'id', sourceKey: 'user_id' })
    Model.hasOne(models.Activities, { foreignKey: 'id', sourceKey: 'activity_id' })

    return models
  }

  return Model
}
