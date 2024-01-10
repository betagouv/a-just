import Sequelize from 'sequelize'

const tableName = 'UserVentilations'

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
          unique: false,
          name: 'user-ventilation-user_id',
          fields: ['user_id'],
        },
        {
          unique: false,
          name: 'user-ventilation-hr_backup_id',
          fields: ['hr_backup_id'],
        },
        {
          unique: false,
          name: 'user-ventilation-user_id-hr_backup_id',
          fields: ['user_id', 'hr_backup_id'],
        },
      ],
    }
  )

  Model.associate = function (models) {
    Model.hasOne(models.HRBackups, { foreignKey: 'id', sourceKey: 'hr_backup_id' })
    Model.hasOne(models.Users, { foreignKey: 'id', sourceKey: 'user_id' })

    return models
  }

  return Model
}
