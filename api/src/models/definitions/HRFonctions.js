import Sequelize from 'sequelize'

const tableName = 'HRFonctions'

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
      code: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      label: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      rank: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      category_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      category_detail: {
        type: Sequelize.STRING(255),
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
      calculatrice_is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      position: {
        type: Sequelize.STRING(255),
        defaultValue: 'Titulaire',
      },
    },
    {
      timestamps: true,
      paranoid: true,
      underscored: true,
      tableName,
      indexes: [
        {
          fields: ['code', 'category_id'],
        },
      ],
    }
  )

  Model.associate = function (models) {
    return models
  }

  return Model
}
