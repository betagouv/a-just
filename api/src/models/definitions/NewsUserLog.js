import Sequelize from 'sequelize'

const tableName = 'NewsUserLog'

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
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      news_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      event_type: {
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
    },
    {
      timestamps: true,
      paranoid: true,
      underscored: true,
      tableName,
      indexes: [
        {
          unique: false,
          name: 'news-user-log-user_id-event_type',
          fields: ['user_id', 'event_type'],
        },
        {
          unique: false,
          name: 'news-user-log-user_id-event_type-news_id',
          fields: ['user_id', 'event_type', 'news_id'],
        },
      ],
    }
  )

  Model.associate = function (models) {
    return models
  }

  return Model
}
