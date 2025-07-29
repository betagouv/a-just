import Sequelize from 'sequelize'

const tableName = 'HumanResources'

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
      first_name: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      last_name: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      matricule: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      juridiction: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      cover_url: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      date_entree: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      date_sortie: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      registration_number: {
        type: Sequelize.STRING(255),
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
          fields: ['backup_id', 'registration_number'],
        },
      ],
    },
  )

  Model.associate = function (models) {
    Model.hasMany(models.HRComments, { foreignKey: 'human_id', sourceKey: 'id' })
    Model.hasOne(models.HRBackups, { foreignKey: 'id', sourceKey: 'backup_id' })
    Model.hasMany(models.HRSituations, { foreignKey: 'human_id', sourceKey: 'id' })
    Model.hasMany(models.HRIndisponibilities, { foreignKey: 'hr_id', sourceKey: 'id' })

    return models
  }

  Model.addHook('afterDestroy', async (hr) => {
    await Model.models.HRVentilations.destroy({
      where: {
        rh_id: hr.id,
      },
    })
  })

  return Model
}
