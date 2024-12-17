import Sequelize from 'sequelize'

const tableName = 'HRSituations'

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
      human_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      etp: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      category_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      fonction_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      date_start: {
        type: Sequelize.DATE,
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
          name: 'hr-situations-human_id',
          fields: ['human_id'],
        },
      ],
    }
  )

  Model.associate = function (models) {
    Model.hasOne(models.HRCategories, {
      foreignKey: 'id',
      sourceKey: 'category_id',
    })
    Model.hasOne(models.HRFonctions, {
      foreignKey: 'id',
      sourceKey: 'fonction_id',
    })
    Model.hasOne(models.HumanResources, {
      foreignKey: 'id',
      sourceKey: 'human_id',
    })
    Model.hasMany(models.HRActivities, { foreignKey: 'hr_situation_id', sourceKey: 'id' })

    return models
  }

  Model.addHook('afterDestroy', async (situation) => {
    await Model.models.HumanResources.updateById(situation.dataValues.human_id, { updated_at: new Date() })
    await Model.models.HRActivities.destroy({
      where: { hr_situation_id: situation.dataValues.id },
    })
  })

  return Model
}
