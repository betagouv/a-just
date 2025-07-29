import Sequelize from 'sequelize'

const tableName = 'HRBackups'

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
      label: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      jirs: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      },
      stat_exclusion: {
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
    },
    {
      timestamps: true,
      paranoid: true,
      underscored: true,
      tableName,
      indexes: [
        {
          fields: ['label'],
        },
      ],
    }
  )

  Model.associate = function (models) {
    Model.hasOne(models.UserVentilations, { foreignKey: 'hr_backup_id', sourceKey: 'id' })
    Model.hasMany(models.HumanResources, { foreignKey: 'backup_id', sourceKey: 'id' })

    return models
  }

  return Model
}
