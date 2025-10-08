import Sequelize from 'sequelize'

const tableName = 'TJ'

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
      i_elst: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      label: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      latitude: {
        type: Sequelize.FLOAT(30, 15),
        allowNull: true,
      },
      longitude: {
        type: Sequelize.FLOAT(30, 15),
        allowNull: true,
      },
      population: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      backup_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      type: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      parent_id: {
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
          unique: false,
          name: 'tj-label',
          fields: ['label'],
        },
        {
          unique: false,
          name: 'tj-parent_id',
          fields: ['parent_id'],
        },
      ],
    },
  )

  Model.associate = function (models) {
    return models
  }

  return Model
}
