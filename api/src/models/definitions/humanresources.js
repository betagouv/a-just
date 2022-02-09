import Sequelize from 'sequelize'

const tableName = 'HumanResources'

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
      first_name: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      last_name: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      cover_url: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      // todo remove
      hr_categorie_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      // todo remove
      hr_fonction_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      juridiction_id: {
        type: Sequelize.INTEGER,
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
      // todo remove
      etp: {
        type: Sequelize.FLOAT,
        allowNull: true,
      },
      // todo remove
      posad: {
        type: Sequelize.FLOAT,
        allowNull: true,
      },
      // todo remove
      note: {
        type: Sequelize.TEXT,
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
    }
  )

  Model.associate = function (models) {  
    Model.hasOne(models.HRCategories, { foreignKey: 'id', sourceKey: 'hr_categorie_id' })  
    Model.hasOne(models.HRFonctions, { foreignKey: 'id', sourceKey: 'hr_fonction_id' })    
    Model.hasOne(models.Juridictions, { foreignKey: 'id', sourceKey: 'juridiction_id' }) 
    Model.hasOne(models.HRComments, { foreignKey: 'human_id', sourceKey: 'id' })       
    
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
