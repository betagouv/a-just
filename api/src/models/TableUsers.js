import { roleToString } from '../constants/roles'
import { accessToString } from '../constants/access'
import { controlPassword, snakeToCamelObject } from '../utils/utils'
import { sentEmail, sentEmailSendinblueUserList } from '../utils/email'
import { TEMPLATE_CRON_USERS_NOT_CONNECTED, TEMPLATE_USER_JURIDICTION_RIGHT_CHANGED } from '../constants/email'
import { crypt } from '../utils'
import { USER_AUTO_LOGIN } from '../constants/log-codes'
import config from 'config'
import { getNbDay } from '../utils/date'

/**
 * Table des utilisateurs
 */

export default (sequelizeInstance, Model) => {
  /**
   * Change user password
   * @param {*} userId
   * @param {*} password
   * @returns
   */
  Model.updatePassword = async (userId, password) => {
    password = crypt.encryptPassword(password)

    return await Model.updateById(userId, {
      new_password_token: null,
      password,
    })
  }

  /**
   * Retourne les informations d'un utilisateur
   * @param {*} userId
   * @returns
   */
  Model.userPreview = async (userId) => {
    const user = await Model.findOne({
      attributes: ['email', 'first_name', 'last_name', 'role'],
      where: { id: userId },
      raw: true,
    })

    if (user) {
      user.access = await Model.models.UsersAccess.getUserAccess(userId)
      return snakeToCamelObject(user)
    }

    return null
  }

  /**
   * Crée un compte utilisateur
   * @param {*} param0
   */
  Model.createAccount = async ({ email, password, firstName, lastName, tj, fonction }) => {
    const user = await Model.findOne({ where: { email } })

    if (!user) {
      if (controlPassword(password) === false) {
        throw 'Mot de passe trop faible!'
      }
      password = crypt.encryptPassword(password)
      await Model.create({
        email,
        password,
        first_name: firstName,
        last_name: lastName,
        tj,
        fonction,
        status: 1,
      })
    } else {
      throw 'Email déjà existant'
    }
  }

  /**
   * Supprimer un compte utilisateur (seulement pour les tests)
   * @params {*} param0
   */
  Model.removeAccountTest = async (userId) => {
    return await Model.destroyById(userId, { force: true })
  }

  /**
   * Supprimer un compte utilisateur
   * @params {*} param0
   */
  Model.removeAccount = async (userId) => {
    return await Model.destroyById(userId)
  }

  /**
   * Retourne la liste des tous les utilisateurs
   * @returns
   */
  Model.getAll = async () => {
    const list = await Model.findAll({
      attributes: ['id', 'email', ['first_name', 'firstName'], ['last_name', 'lastName'], 'role', 'tj', 'fonction'],
      raw: true,
    })

    for (let i = 0; i < list.length; i++) {
      list[i].access = await Model.models.UsersAccess.getUserAccess(list[i].id)
      list[i].accessName = list[i].access.map((a) => accessToString(a)).join(', ')
      list[i].roleName = roleToString(list[i].role)
      list[i].ventilations = await Model.models.UserVentilations.getUserVentilations(list[i].id)
    }

    return list
  }

  /**
   * Mise à jour des informations utilisateurs et informer en cas de changement d'attribution
   * @param {*} param0
   */
  Model.updateAccount = async ({ userId, access, ventilations }) => {
    const user = await Model.findOne({
      where: {
        id: userId,
      },
      raw: true,
    })

    console.log('--------- Ventilations:', ventilations)
    console.log('--------- user:', user)
    if (user) {
      await Model.models.UsersAccess.updateAccess(userId, access)
      console.log('--------- Before00')
      const oldVentilations = (await Model.models.UserVentilations.getUserVentilations(userId)).map((v) => v.id).sort()
      console.log('--------- Before01')
      const ventilationsList = await Model.models.UserVentilations.updateVentilations(userId, ventilations)
      console.log('--------- Before02')
      console.log('--------- VentilationsList:', ventilationsList)
      console.log('--------- After')

      if (ventilationsList.length) {
        sentEmailSendinblueUserList(user, true)

        const newVentilationList = ventilationsList.map((v) => v.id).sort()
        if (JSON.stringify(newVentilationList) !== JSON.stringify(oldVentilations)) {
          await sentEmail(
            {
              email: user.email,
            },
            TEMPLATE_USER_JURIDICTION_RIGHT_CHANGED,
            {
              user: `${user.first_name} ${user.last_name}`,
              juridictionsList: ventilationsList.map((v) => v.label).join(', '),
            }
          )
        }
      } else {
        sentEmailSendinblueUserList(user, false)
      }
    } else {
      throw 'User not found'
    }
  }

  /**
   * Control de l'ensemble des personnes à la dernière date de connexion
   */
  Model.checkLastConnexion = async () => {
    if (config.nbMaxDayCanBeInactive === null) {
      return
    }

    const users = await Model.findAll({
      attributes: ['id', 'first_name', 'last_name', 'email'],
      raw: true,
    })
    const usersFinded = []

    for (let i = 0; i < users.length; i++) {
      const lastLog = await Model.models.Logs.findLastLog(users[i].id, USER_AUTO_LOGIN, { userId: users[i].id })
      let lastConnexionDate = new Date(2023, 2, 1) // date fictive base sur la date de mise en prod
      if (lastLog) {
        lastConnexionDate = new Date(lastLog.createdAt)
      }

      const nbDays = getNbDay(lastConnexionDate, new Date())
      if (nbDays >= config.nbMaxDayCanBeInactive) {
        usersFinded.push({ name: (users[i].first_name || '') + ' ' + (users[i].last_name || ''), email: users[i].email, nbDays })
      }
    }

    if (usersFinded.length) {
      await sentEmail(
        {
          email: config.supportEmail,
        },
        TEMPLATE_CRON_USERS_NOT_CONNECTED,
        {
          userList: usersFinded,
        }
      )
    }
  }

  return Model
}
