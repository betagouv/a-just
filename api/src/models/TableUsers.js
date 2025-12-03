import { roleToString } from '../constants/roles'
import {
  HAS_ACCESS_TO_CONTRACTUEL,
  HAS_ACCESS_TO_GREFFIER,
  HAS_ACCESS_TO_MAGISTRAT,
  USER_ACCESS_ACTIVITIES_READER,
  USER_ACCESS_ACTIVITIES_WRITER,
  USER_ACCESS_AVERAGE_TIME_READER,
  USER_ACCESS_AVERAGE_TIME_WRITER,
  USER_ACCESS_CALCULATOR_READER,
  USER_ACCESS_CALCULATOR_WRITER,
  USER_ACCESS_DASHBOARD_READER,
  USER_ACCESS_DASHBOARD_WRITER,
  USER_ACCESS_REAFFECTATOR_READER,
  USER_ACCESS_REAFFECTATOR_WRITER,
  USER_ACCESS_SIMULATOR_READER,
  USER_ACCESS_SIMULATOR_WRITER,
  USER_ACCESS_VENTILATIONS_READER,
  USER_ACCESS_VENTILATIONS_WRITER,
  USER_ACCESS_WHITE_SIMULATOR_READER,
  USER_ACCESS_WHITE_SIMULATOR_WRITER,
  accessToString,
} from '../constants/access'
import { snakeToCamelObject } from '../utils/utils'
import { sentEmail, sentEmailSendinblueUserList } from '../utils/email'
import {
  TEMPLATE_CRON_USERS_NOT_CONNECTED,
  TEMPLATE_USER_JURIDICTION_RIGHT_CHANGED,
  TEMPLATE_USER_JURIDICTION_RIGHT_CHANGED_AGAIN,
  TEMPLATE_USER_JURIDICTION_RIGHT_CHANGED_AGAIN_CA,
  TEMPLATE_USER_JURIDICTION_RIGHT_CHANGED_CA,
} from '../constants/email'
import { USER_AUTO_LOGIN } from '../constants/log-codes'
import config from 'config'
import { getNbDay, humanDate, today } from '../utils/date'
import { comparePasswords, cryptPassword } from '../utils/password/password'
import { differenceInMinutes } from 'date-fns'
import { Op } from 'sequelize'

/**
 * Table des utilisateurs
 */

export default (sequelizeInstance, Model) => {
  /**
   * Control des connection avec les règles de blockages pour les users et admin
   */
  Model.tryConnection = async (email, password, roles, andNull = false) => {
    email = (email || '').toLowerCase()
    const cleanUser = async (user) => {
      await user.update({
        nb_try_connection: null,
        first_try_connection: null,
      })
      user.dataValues.nb_try_connection = null
      user.dataValues.first_try_connection = null
      return user
    }

    let options = { role: roles }
    if (andNull) {
      options = {
        [Op.or]: [
          {
            role: roles,
          },
          {
            role: { [Op.eq]: null },
          },
        ],
      }
    }

    let user = await Model.findOne({ where: { email, ...options } })
    if (user) {
      if (user.dataValues.status === 0) {
        return "Votre compte n'est plus accessible."
      }

      if (user.dataValues.first_try_connection) {
        const now = new Date()
        const tryDate = new Date(user.dataValues.first_try_connection)
        let nbMinutes = differenceInMinutes(now, tryDate)

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
      attributes: ['email', 'first_name', 'last_name', 'role', 'id', 'referentiel_ids'],
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
   * Retourne les informations d'un utilisateur via l'email
   * @param {*} userId
   * @returns
   */
  Model.userPreviewWithEmail = async (userEmail) => {
    const user = await Model.findOne({
      attributes: ['id', 'email', 'first_name', 'last_name', 'role'],
      where: { email: userEmail },
      raw: true,
    })

    if (user) {
      user.access = await Model.models.UsersAccess.getUserAccess(user.id)
      return snakeToCamelObject(user)
    }

    return null
  }

  /**
   * Crée un compte utilisateur
   * @param {*} param0
   */
  Model.createAccount = async ({ email, password, firstName, lastName, tj, fonction }) => {
    let user = await Model.findOne({ where: { email } })

    if (!user) {
      if (password) {
        password = cryptPassword(password, email)
      }

      user = await Model.create({
        email,
        password,
        first_name: firstName,
        last_name: lastName,
        tj,
        fonction,
        status: 1,
        referentiel_ids: null,
      })

      // by default all access are granted
      const accessIds = [
        USER_ACCESS_DASHBOARD_READER,
        USER_ACCESS_DASHBOARD_WRITER,
        USER_ACCESS_VENTILATIONS_READER,
        USER_ACCESS_VENTILATIONS_WRITER,
        USER_ACCESS_ACTIVITIES_READER,
        USER_ACCESS_ACTIVITIES_WRITER,
        USER_ACCESS_AVERAGE_TIME_READER,
        USER_ACCESS_AVERAGE_TIME_WRITER,
        USER_ACCESS_CALCULATOR_READER,
        USER_ACCESS_CALCULATOR_WRITER,
        USER_ACCESS_SIMULATOR_READER,
        USER_ACCESS_SIMULATOR_WRITER,
        USER_ACCESS_WHITE_SIMULATOR_READER,
        USER_ACCESS_WHITE_SIMULATOR_WRITER,
        USER_ACCESS_REAFFECTATOR_READER,
        USER_ACCESS_REAFFECTATOR_WRITER,
        HAS_ACCESS_TO_MAGISTRAT,
        HAS_ACCESS_TO_GREFFIER,
        HAS_ACCESS_TO_CONTRACTUEL,
      ]
      await Model.models.UsersAccess.updateAccess(user.id, accessIds)

      return user
    } else {
      throw 'Un compte existe déjà avec cet e-mail. Si vous avez oublié votre mot de passe, allez dans la section “Se connecter” et cliquez sur “Mot de passe oublié".'
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
      attributes: ['id', 'email', ['first_name', 'firstName'], ['last_name', 'lastName'], 'role', 'tj', 'fonction', ['referentiel_ids', 'referentielIds']],
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
  Model.updateAccount = async ({ userId, access, ventilations, referentielIds }) => {
    const user = await Model.findOne({
      where: {
        id: userId,
      },
      raw: true,
    })

    if (user) {
      await Model.updateById(user.id, {
        referentiel_ids: referentielIds,
      })
      const oldAccess = (await Model.models.UsersAccess.getUserAccess(userId)).sort()
      await Model.models.UsersAccess.updateAccess(userId, access)
      const newAccess = (await Model.models.UsersAccess.getUserAccess(userId)).sort()
      await Model.updateById(user.id, {
        updated_at: new Date(),
      })
      const oldVentilations = (await Model.models.UserVentilations.getUserVentilations(userId)).map((v) => v.id).sort()
      const ventilationsList = await Model.models.UserVentilations.updateVentilations(userId, ventilations)

      if (ventilationsList.length) {
        sentEmailSendinblueUserList(user, true)
        console.log(oldAccess)

        const newVentilationList = ventilationsList.map((v) => v.id).sort()
        if (JSON.stringify(newVentilationList) !== JSON.stringify(oldVentilations) || JSON.stringify(newAccess) !== JSON.stringify(oldAccess)) {
          if (oldAccess.length === 0) {
            // is new ventilation
            await sentEmail(
              {
                email: user.email,
              },
              Number(config.juridictionType) === 1 ? TEMPLATE_USER_JURIDICTION_RIGHT_CHANGED_CA : TEMPLATE_USER_JURIDICTION_RIGHT_CHANGED,
              {
                user: `${user.first_name} ${user.last_name}`,
                juridictionsList: ventilationsList.map((v) => v.label).join(', '),
              },
            )
          } else {
            // update existing ventilation
            await sentEmail(
              {
                email: user.email,
              },
              Number(config.juridictionType) === 1 ? TEMPLATE_USER_JURIDICTION_RIGHT_CHANGED_AGAIN_CA : TEMPLATE_USER_JURIDICTION_RIGHT_CHANGED_AGAIN,
              {
                user: `${user.first_name} ${user.last_name}`,
                juridictionsList: ventilationsList.map((v) => v.label).join(', '),
              },
            )
          }
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
        options,
      )
    }
  }

  Model.checkAccountToAnonymise = async () => {
    const now = today()
    now.setFullYear(now.getFullYear() - 5)
    const users = await Model.findAll({
      attributes: ['id', 'first_name', 'last_name', 'created_at', 'updated_at', 'deleted_at', 'email'],
      where: {
        deleted_at: {
          [Op.lte]: now,
        },
        first_name: {
          [Op.ne]: 'anonyme',
        },
      },
      paranoid: false,
    })

    for (let i = 0; i < users.length; i++) {
      await users[i].update({
        first_name: 'anonyme',
        last_name: 'anonyme',
        email: 'anonyme',
      })
    }
  }

  Model.canViewCompleteReferentiel = async (userId) => {
    const user = await Model.findOne({
      where: {
        id: userId,
      },
    })

    return user.referentiel_ids === null ? true : false
  }

  return Model
}
