import Sequelize from 'sequelize'

const tableName = 'Activities'

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
      hr_backup_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      periode: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      contentieux_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
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
        allowNull: true,
      },
      original_entrees: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      original_sorties: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      original_stock: {
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
          unique: true,
          name: 'activities-backup-periode-cont',
          fields: ['hr_backup_id', 'periode', 'contentieux_id'],
        },
      ],
    }
  )

  Model.associate = function (models) {
    Model.hasOne(models.ContentieuxReferentiels, { foreignKey: 'id', sourceKey: 'contentieux_id' })

    return models
  }

  return Model
}
