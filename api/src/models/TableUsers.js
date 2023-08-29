import { roleToString } from '../constants/roles'
import { accessToString } from '../constants/access'
import { snakeToCamelObject } from '../utils/utils'
import { sentEmail, sentEmailSendinblueUserList } from '../utils/email'
import { TEMPLATE_CRON_USERS_NOT_CONNECTED, TEMPLATE_USER_JURIDICTION_RIGHT_CHANGED } from '../constants/email'
import { USER_AUTO_LOGIN } from '../constants/log-codes'
import config from 'config'
import { getNbDay, humanDate } from '../utils/date'
import { comparePasswords, cryptPassword } from '../utils/password/password'
import { differenceInMinutes } from 'date-fns'

/**
 * Table des utilisateurs
 */

export default (sequelizeInstance, Model) => {
  /**
   * Control des connection avec les règles de blockages pour les users et admin
   */
  Model.tryConnection = async (email, password, roles) => {
    email = (email || '').toLowerCase()
    console.log('[tableUsers.js][line 22] email:', email)
    const cleanUser = async (user) => {
      await user.update({
        nb_try_connection: null,
        first_try_connection: null,
      })
      user.dataValues.nb_try_connection = null
      user.dataValues.first_try_connection = null
      return user
    }
    console.log('[tableUsers.js][line 32] roles:', roles)

    let user = await Model.findOne({ where: { email, role: roles } })
    console.log('[tableUsers.js][line 35] user:', user)
    if (user) {
      if (user.dataValues.status === 0) {
        return "Votre compte n'est plus accessible."
      }
      console.log('user:', user.dataValues)

      if (user.dataValues.first_try_connection) {
        const now = new Date()
        const tryDate = new Date(user.dataValues.first_try_connection)
        let nbMinutes = differenceInMinutes(now, tryDate)

        console.log(nbMinutes, config.securities.users.delaiAboutLockConnection, nbMinutes >= config.securities.users.delaiAboutLockConnection)
        if (nbMinutes >= config.securities.users.delaiAboutLockConnection) {
          user = await cleanUser(user)
        }
      }

      if ((user.dataValues.nb_try_connection || 0) >= config.securities.users.nbMaxTryConnection) {
        const now = new Date()
        const tryDate = new Date(user.dataValues.first_try_connection)
        let nbMinutes = differenceInMinutes(now, tryDate)

        return `Votre compte est bloqué ! Vous devez attendre ${config.securities.users.delaiAboutLockConnection - nbMinutes} minutes pour vous reconnecter.`
      }

      if (comparePasswords(password, user.dataValues.password)) {
        delete user.dataValues.password
        user = await cleanUser(user)

        return user.dataValues
      } else {
        // add to try connection
        const totalTryConnection = (user.dataValues.nb_try_connection || 0) + 1
        user.update({
          nb_try_connection: totalTryConnection,
          first_try_connection: user.dataValues.first_try_connection || new Date(),
        })
        if (totalTryConnection / config.securities.users.nbMaxTryConnection < 0.3) {
          return 'Email ou mot de passe incorrect.'
        } else {
          return `Email ou mot de passe incorrect. Essai ${totalTryConnection}/${config.securities.users.nbMaxTryConnection}`
        }
      }
    }

    return 'Email ou mot de passe incorrect'
  }

  /**
   * Change user password
   * @param {*} userId
   * @param {*} password
   * @returns
   */
  Model.updatePassword = async (userId, password, email) => {
    password = cryptPassword(password, email)

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
      password = cryptPassword(password, email)
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
   * Supprimer un compte utilisateur
   * @params {*} param0
   */
  Model.removeAccount = async (userId, options = {}) => {
    const user = await Model.findOne({
      where: {
        id: userId,
      },
    })

    if (user) {
      sentEmailSendinblueUserList(user, false)

      return await Model.destroyById(userId, options)
    }

    return null
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

    if (user) {
      await Model.models.UsersAccess.updateAccess(userId, access)
      const oldVentilations = (await Model.models.UserVentilations.getUserVentilations(userId)).map((v) => v.id).sort()
      const ventilationsList = await Model.models.UserVentilations.updateVentilations(userId, ventilations)

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
      attributes: ['id', 'first_name', 'last_name', 'email', 'fonction', 'created_at'],
      raw: true,
    })
    const usersFinded = []

    for (let i = 0; i < users.length; i++) {
      const juridictions = (await Model.models.HRBackups.list(users[i].id)).map((t) => t.label)
      const lastLog = await Model.models.Logs.findLastLog(users[i].id, USER_AUTO_LOGIN, { userId: users[i].id })
      let lastConnexionDate = null

      const userInfos = {
        name: (users[i].first_name || '') + ' ' + (users[i].last_name || ''),
        email: users[i].email,
        fonction: users[i].fonction || '',
        created_at: users[i].created_at,
        juridictions,
      }

      if (!lastLog) {
        usersFinded.push({
          ...userInfos,
          nbDays: 'jamais',
        })
      } else if (lastLog) {
        lastConnexionDate = new Date(lastLog.createdAt)
        const nbDays = getNbDay(lastConnexionDate, new Date())
        if (lastConnexionDate === null && nbDays >= config.nbMaxDayCanBeInactive) {
          usersFinded.push({
            ...userInfos,
            nbDays: nbDays + ' jours',
          })
        }
      }
    }

    if (usersFinded.length) {
      const userCSV = [
        'prénom nom,email,nb jours,date de creation de compte,fonction,juridictions,date de creation,',
        ...usersFinded.map((u) => `${u.name},${u.email},${u.nbDays},${humanDate(u.created_at)},${u.fonction},${u.juridictions.join(' - ')}`),
      ].join('\n')

      let buff = Buffer.from(userCSV)
      const options = {
        attachment: [{ content: buff.toString('base64'), name: 'export.csv' }],
      }

      await sentEmail(
        {
          email: config.supportEmail,
        },
        TEMPLATE_CRON_USERS_NOT_CONNECTED,
        {
          userList: usersFinded,
        },
        options
      )
    }
  }

  return Model
}
