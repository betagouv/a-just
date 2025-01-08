import Sequelize from 'sequelize'

const tableName = 'ContentieuxReferentiels'

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
      label: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      code_import: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      parent_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      rank: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      value_quality_in: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      value_quality_out: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      value_quality_stock: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      help_url: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      compter: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      },
      only_to_hr_backup: { // null => for all // 1,2 => hr_backup id = 1 or 2
        type: Sequelize.ARRAY(Sequelize.INTEGER),
        allowNull: true,
      },
      check_ventilation: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
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
          name: 'contentieux-referentiels-code_import',
          fields: ['code_import'],
        },
      ],
    }
  )

  Model.associate = function (models) {
    return models
  }

  return Model
}
