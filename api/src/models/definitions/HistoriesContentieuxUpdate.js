import Sequelize from 'sequelize';

const tableName = 'HistoriesContentieuxUpdate';

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
      backup_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      user_id: {
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
  );

  Model.associate = function (models) {
    Model.hasOne(models.Users, { foreignKey: 'id', sourceKey: 'user_id' });
    Model.hasOne(models.OptionsBackupJuridictions, { foreignKey: 'id', sourceKey: 'backup_id' });

    return models;
  };

  return Model;
};
