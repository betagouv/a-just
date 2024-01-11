import Sequelize from 'sequelize'

const tableName = 'OptionsBackupJuridictions'

export default sequelizeInstance => {
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
      option_backup_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      juridiction_id: {
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
    }
  )

  Model.associate = function (models) {   
    Model.hasOne(models.OptionsBackups, { foreignKey: 'id', sourceKey: 'option_backup_id' }) 
    Model.hasMany(models.UserVentilations, { foreignKey: 'hr_backup_id', sourceKey: 'juridiction_id' })  

    return models
  }

  return Model
}
