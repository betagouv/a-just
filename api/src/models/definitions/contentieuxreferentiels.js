import Sequelize from 'sequelize'

const tableName = 'ContentieuxReferentiels'

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
      niveau_1: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      niveau_2: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      niveau_3: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      niveau_4: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      niveau_5: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      niveau_6: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      average_processing_time: {
        type: Sequelize.FLOAT,
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
    return models
  }

  return Model
}
