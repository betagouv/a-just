import Sequelize from 'sequelize'

const tableName = 'HRBackupsGroupsIds'

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
      hr_backup_group_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      hr_backup_id: {
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
          fields: ['label'],
        },
      ],
    }
  )

  Model.associate = function (models) {
    Model.hasOne(models.HRBackupsGroups, { foreignKey: 'id', sourceKey: 'hr_backup_group_id' })
    
    return models
  }

  return Model
}
