import Sequelize from 'sequelize'

const tableName = 'News'

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
      html: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      icon: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      background_color: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      text_color: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      delay_before_auto_closing: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      action_button_text: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      action_button_url: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      action_button_color: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      date_start: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      date_stop: {
        type: Sequelize.DATE,
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
    },
    {
      timestamps: true,
      paranoid: true,
      underscored: true,
      tableName,
    }
  )

  Model.associate = function (models) {
    Model.hasMany(models.NewsUserLog, { foreignKey: 'news_id', sourceKey: 'id' })

    return models
  }

  return Model
}
