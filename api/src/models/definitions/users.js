import Sequelize from 'sequelize'
import { controlPassword, validateEmail } from '../../utils/utils'
import { crypt } from '../../utils'

export default (sequelizeInstance) => {
  const Model = sequelizeInstance.define(
    'Users',
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
        type: Sequelize.INTEGER,
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



  Model.addHook('beforeCreate', (user) => {
    if (!user.first_name || user.first_name.length < 2) {
      throw 'Prénom non valide!'
    }

    if (!user.last_name || user.last_name.length < 2) {
      throw 'Nom non valide!'
    }

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
  })

  return Model
}
