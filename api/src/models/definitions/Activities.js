import Sequelize from 'sequelize'

const tableName = 'Activities'

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
      juridiction_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      periode: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      contentieux: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      entrees: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      sorties: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      stock: {
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
    return models
  }

  return Model
}
