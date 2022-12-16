import Sequelize from 'sequelize'
import { controlPassword, validateEmail } from '../../utils/utils'
import { crypt } from '../../utils'

const tableName = 'Users'

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
      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
      },
      password: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      new_password_token: {
        type: Sequelize.STRING(255),
        allowNull: true,
        unique: true,
      },
      role: {
        type: Sequelize.INTEGER, // 1 - ADMIN / 2 - USER
        allowNull: true,
      },
      status: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      first_name: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      last_name: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      tj: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      fonction: {
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

  Model.addHook('beforeCreate', (user) => {
    if (validateEmail(user.email) === false) {
      throw 'Email non valide!'
    }

    if (controlPassword(user.password) === false) {
      throw 'Mot de passe trop faible!'
    }
    user.password = crypt.encryptPassword(user.password)
  })

  Model.addHook('beforeUpdate', async (user) => {
    if (user.email !== undefined && validateEmail(user.email) === false) {
      throw 'Email non valide!'
    }

    if (user.password) {
      if (controlPassword(user.password) === false) {
        throw 'Mot de passe trop faible!'
      }
      user.password = crypt.encryptPassword(user.password)
    }
  })

  return Model
}
