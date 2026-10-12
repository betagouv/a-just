import Sequelize from 'sequelize'

const tableName = 'HRActivities'

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
      hr_situation_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      nac_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      percent: {
        type: Sequelize.FLOAT,
        allowNull: false,
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
    }
  )

  Model.associate = function (models) {
    Model.hasOne(models.ContentieuxReferentiels, { foreignKey: 'id', sourceKey: 'nac_id' })
    Model.hasOne(models.HRBackups, { foreignKey: 'id', sourceKey: 'backup_id' })
    Model.hasOne(models.HRSituations, { foreignKey: 'id', sourceKey: 'hr_situation_id' })

    return models
  }

  return Model
}
