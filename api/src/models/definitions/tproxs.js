import Sequelize from 'sequelize'

const tableName = 'tproxs'

export default (sequelizeInstance) => {
  const Model = sequelizeInstance.define(tableName, {
    id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
      unique: true,
    },
    tprox: {
      type: Sequelize.TEXT,
      allowNull: false,
    },
    tj: {
      type: Sequelize.TEXT,
      allowNull: false,
    },
    createdAt: {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.fn('NOW'),
    },
    updatedAt: {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.fn('NOW'),
    },
  })

  Model.associate = function (models) {
    return models
  }

  return Model
}
