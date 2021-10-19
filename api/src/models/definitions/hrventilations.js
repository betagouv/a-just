import Sequelize from 'sequelize'

export default sequelizeInstance => {
  const Model = sequelizeInstance.define(
    'HRVentilations',
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
    }
  )

  Model.associate = function (models) {    
    return models
  }

  return Model
}
