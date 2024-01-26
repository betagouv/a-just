import Sequelize from 'sequelize'

const tableName = 'ContentieuxOptions'

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
      contentieux_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      average_processing_time: {
        type: Sequelize.DOUBLE(11),
        allowNull: true,
      },
      average_processing_time_fonc: {
        type: Sequelize.DOUBLE(11),
        allowNull: true,
      },
      backup_id: {
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
          name: 'contentieux-options-backup_id',
          fields: ['backup_id'],
        },
      ],
    }
  )

  Model.associate = function (models) {
    Model.hasOne(models.ContentieuxReferentiels, { foreignKey: 'id', sourceKey: 'contentieux_id' })
    Model.hasOne(models.OptionsBackups, { foreignKey: 'id', sourceKey: 'backup_id' })

    return models
  }

  return Model
}
