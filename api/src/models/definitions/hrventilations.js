import Sequelize from 'sequelize'

// TODO A SUPPRIMER DANS UN SECOND TEMPS, après une mise en prod

const tableName = 'HRVentilations'

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
      rh_id: {
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
      date_start: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      date_stop: {
        type: Sequelize.DATE,
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
    }
  )

  Model.associate = function (models) {    
    Model.hasOne(models.ContentieuxReferentiels, { foreignKey: 'id', sourceKey: 'nac_id' })  

    return models
  }

  return Model
}
