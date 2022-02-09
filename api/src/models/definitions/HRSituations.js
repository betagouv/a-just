import Sequelize from 'sequelize'

const tableName = 'HRSitutations'

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
        allowNull: false,
      },
      fonction_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
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
    }
  )

  Model.associate = function (models) {  
    Model.hasOne(models.HumanResources, { foreignKey: 'id', sourceKey: 'human_id' })

    return models
  }

  return Model
}
