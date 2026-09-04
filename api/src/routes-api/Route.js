import { Route as RouteBase } from 'koa-smart'
import {
  USER_ACCESS_ACTIVITIES_READER,
  USER_ACCESS_ACTIVITIES_WRITER,
  USER_ACCESS_AVERAGE_TIME_READER,
  USER_ACCESS_AVERAGE_TIME_WRITER,
  USER_ACCESS_CALCULATOR_READER,
  USER_ACCESS_CALCULATOR_WRITER,
  USER_ACCESS_REAFFECTATOR_READER,
  USER_ACCESS_REAFFECTATOR_WRITER,
  USER_ACCESS_SIMULATOR_READER,
  USER_ACCESS_SIMULATOR_WRITER,
  USER_ACCESS_VENTILATIONS_READER,
  USER_ACCESS_VENTILATIONS_WRITER,
  USER_ACCESS_WHITE_SIMULATOR_READER,
} from '../constants/access'
import { USER_ROLE_ADMIN, USER_ROLE_SUPER_ADMIN } from '../constants/roles'
import { snakeToCamelObject } from '../utils/utils'
import Sentry from '../utils/sentry'

/**
 * Class autour de la l'authentification et des droits
 */
export default class Route extends RouteBase {
  // liste des models de BDD
  models

  /**
   * Constructeur
   * @param {*} params
   */

  constructor(params) {
    super(params)

    this.models = params.models
  }

  /**
   * Function de controle des erreurs utilisateur
   * @param {*} ctx
   * @param {*} infos
   * @param {*} next
   */
  async beforeRoute(ctx, infos, next) {
    // the "beforeRoute" function is executed before any call to a route belonging to the same class
    // (or a class ihneriting from it) is made.
    try {
      // force to load user access
      await this.addUserToBody(ctx)

      await super.beforeRoute(ctx, infos, next)
    } catch (e) {
      console.error(e)
      Sentry.captureException(e)
      throw e
    }
  }

  /**
   * Fonction qui retourne l'utilisateur connecté
   * @param {*} ctx
   * @returns
   */
  user(ctx) {
    return ctx.state.user
  }

  /**
   * Fonction qui retourne l'id de l'utilisateur connecté
   * @param {*} ctx
   * @returns
   */
  userId(ctx) {
    return this.user(ctx) ? this.user(ctx).id : null
  }

  /**
   * Fonction pour récupérer l'ensemble de l'utilisateur connecté
   * @param {*} ctx
   * @param {*} id
   * @returns
   */
  async addUserInfoInBody(ctx, id) {
    if (!id && ctx.state.user) {
      id = ctx.state.user.id
    }
    this.assertUnauthorized(id)

    const userRows = await this.models.Users.findAll({
      attributes: ['id', 'email', 'role', 'first_name', 'last_name', 'referentiel_ids'],
      where: {
        id,
        status: 1,
      },
      include: [{
        model: this.models.UserVentilations,
        required: false,
      }, {
        model: this.models.UsersAccess,
        required: false,
      }],
      raw: true,
    })

    const userRaw = userRows[0]
    this.assertUnauthorized(userRaw)

    const user = {
      id: userRaw.id,
      email: userRaw.email,
      role: userRaw.role,
      first_name: userRaw.first_name,
      last_name: userRaw.last_name,
      referentiel_ids: userRaw.referentiel_ids,
      ...snakeToCamelObject({
        id: userRaw.id,
        email: userRaw.email,
        role: userRaw.role,
        first_name: userRaw.first_name,
        last_name: userRaw.last_name,
        referentiel_ids: userRaw.referentiel_ids,
      }),
      ventilations: [...new Set(userRows.map((row) => row['UserVentilations.hr_backup_id']).filter(Boolean))],
      access: [...new Set(userRows.map((row) => row['UsersAccesses.access_id']).filter((accessId) => accessId != null))],
    }

    ctx.body.user = user
    ctx.state.user = user // force to add to state with regenerated access

    return user
  }

  /**
   * Fonction pour récupérer l'ensemble de l'utilisateur connecté
   * @param {*} ctx
   * @returns
   */
  async addUserToBody(ctx) {
    const id = ctx && ctx.state && ctx.state.user && ctx.state.user.id
    if (!id) {
      return
    }

    const userRows = await this.models.Users.findAll({
      attributes: ['id', 'email', 'role', 'first_name', 'last_name', 'referentiel_ids'],
      where: {
        id,
        status: 1,
      },
      include: [{
        model: this.models.UserVentilations,
        required: false,
      }, {
        model: this.models.UsersAccess,
        required: false,
      }],
      raw: true,
    })

    const userRaw = userRows[0]
    this.assertUnauthorized(userRaw)

    const user = {
      id: userRaw.id,
      email: userRaw.email,
      role: userRaw.role,
      first_name: userRaw.first_name,
      last_name: userRaw.last_name,
      referentiel_ids: userRaw.referentiel_ids,
      ...snakeToCamelObject({
        id: userRaw.id,
        email: userRaw.email,
        role: userRaw.role,
        first_name: userRaw.first_name,
        last_name: userRaw.last_name,
        referentiel_ids: userRaw.referentiel_ids,
      }),
      ventilations: [...new Set(userRows.map((row) => row['UserVentilations.hr_backup_id']).filter(Boolean))],
      access: [...new Set(userRows.map((row) => row['UsersAccesses.access_id']).filter((accessId) => accessId != null))],
    }

    ctx.body.user = user
    ctx.state.user = user // force to add to state with regenerated access
  }

  /**
   * Fonction pour retourner si l'utilisateur connecté est administrateur
   * @param {*} ctx
   * @returns
   */
  isAdmin(ctx) {
    return isAdmin(ctx)
  }

  /**
   * Fonction pour retourner si l'utilisateur connecté est super administrateur
   * @param {*} ctx
   * @returns
   */
  isSuperAdmin(ctx) {
    return isSuperAdmin(ctx)
  }
}

/**
 * Control si l'utilisateur existe
 * @param {*} ctx
 * @returns
 */
function isExist(ctx) {
  return !!ctx.body.user
}

/**
 * Control si l'utilisateur existe et à des accès
 * @param {*} ctx
 * @returns
 */
function isLogin(ctx) {
  return !!ctx.body.user && ctx.body.user.access.length > 0 && ctx.body.user.ventilations.length > 0
}

/**
 * Contril si l'utilisateur est de type Admin
 * @param {*} ctx
 * @returns
 */
function isAdmin(ctx) {
  return !!ctx.body.user && [USER_ROLE_ADMIN, USER_ROLE_SUPER_ADMIN].indexOf(ctx.body.user.role) !== -1
}

/**
 * Contril si l'utilisateur est de type Super Admin
 * @param {*} ctx
 * @returns
 */
function isSuperAdmin(ctx) {
  return !!ctx.body.user && [USER_ROLE_SUPER_ADMIN].indexOf(ctx.body.user.role) !== -1
}

/**
 * Control si l'utilisateur des accès du Calculateur
 * @param {*} ctx
 * @returns
 */
function canVewCalculator(ctx) {
  return isLogin(ctx) && ctx.body.user.access && ctx.body.user.access.indexOf(USER_ACCESS_CALCULATOR_READER) !== -1
}

/**
 * Control si l'utilisateur des accès du Calculateur
 * @param {*} ctx
 * @returns
 */
function canEditCalculator(ctx) {
  return isLogin(ctx) && ctx.body.user.access && ctx.body.user.access.indexOf(USER_ACCESS_CALCULATOR_WRITER) !== -1
}

/**
 * Control si l'utilisateur des accès de Ventilation
 * @param {*} ctx
 * @returns
 */
function canVewHR(ctx) {
  return isLogin(ctx) && ctx.body.user.access && ctx.body.user.access.indexOf(USER_ACCESS_VENTILATIONS_READER) !== -1
}

/**
 * Control si l'utilisateur des accès de Ventilation
 * @param {*} ctx
 * @returns
 */
function canEditHR(ctx) {
  return isLogin(ctx) && ctx.body.user.access && ctx.body.user.access.indexOf(USER_ACCESS_VENTILATIONS_WRITER) !== -1
}

/**
 * Control si l'utiliusateur des accès d'Activitiés
 * @param {*} ctx
 * @returns
 */
function canVewActivities(ctx) {
  return isLogin(ctx) && ctx.body.user.access && ctx.body.user.access.indexOf(USER_ACCESS_ACTIVITIES_READER) !== -1
}

/**
 * Control si l'utiliusateur des accès d'Activitiés
 * @param {*} ctx
 * @returns
 */
function canEditActivities(ctx) {
  return isLogin(ctx) && ctx.body.user.access && ctx.body.user.access.indexOf(USER_ACCESS_ACTIVITIES_WRITER) !== -1
}

/**
 * Control si l'utiliusateur des accès de temps moyen
 * @param {*} ctx
 * @returns
 */
function canVewContentieuxOptions(ctx) {
  return isLogin(ctx) && ctx.body.user.access && ctx.body.user.access.indexOf(USER_ACCESS_AVERAGE_TIME_READER) !== -1
}

/**
 * Control si l'utiliusateur des accès de temps moyen
 * @param {*} ctx
 * @returns
 */
function canEditContentieuxOptions(ctx) {
  return isLogin(ctx) && ctx.body.user.access && ctx.body.user.access.indexOf(USER_ACCESS_AVERAGE_TIME_WRITER) !== -1
}

/**
 * Control si l'utiliusateur des simulations
 * @param {*} ctx
 * @returns
 */
function canVewSimulation(ctx) {
  return isLogin(ctx) && ctx.body.user.access && ctx.body.user.access.indexOf(USER_ACCESS_SIMULATOR_READER) !== -1
}

/**
 * Control si l'utiliusateur des accès de simulations
 * @param {*} ctx
 * @returns
 */
function canEditSimulation(ctx) {
  return (
    isLogin(ctx) &&
    ctx.body.user.access &&
    (ctx.body.user.access.indexOf(USER_ACCESS_SIMULATOR_READER) !== -1 || ctx.body.user.access.indexOf(USER_ACCESS_SIMULATOR_WRITER) !== -1)
  )
}

/**
 * Control si l'utiliusateur des accès de simulations
 * @param {*} ctx
 * @returns
 */
function canVewWhiteSimulation(ctx) {
  return isLogin(ctx) && ctx.body.user.access && ctx.body.user.access.indexOf(USER_ACCESS_WHITE_SIMULATOR_READER) !== -1
}

/**
 * Control si l'utiliusateur des accès de simulations
 * @param {*} ctx
 * @returns
 */
function canEditWhiteSimulation(ctx) {
  return (
    isLogin(ctx) &&
    ctx.body.user.access &&
    (ctx.body.user.access.indexOf(USER_ACCESS_WHITE_SIMULATOR_READER) !== -1 || ctx.body.user.access.indexOf(USER_ACCESS_WHITE_SIMULATOR_WRITER) !== -1)
  )
}

/**
 * Control si l'utiliusateur des accès de réaffectateur
 * @param {*} ctx
 * @returns
 */
function canVewReaffectator(ctx) {
  return isLogin(ctx) && ctx.body.user.access && ctx.body.user.access.indexOf(USER_ACCESS_REAFFECTATOR_READER) !== -1
}

/**
 * Control si l'utiliusateur des accès de réaffectateur
 * @param {*} ctx
 * @returns
 */
function canEditReaffectator(ctx) {
  return (
    isLogin(ctx) &&
    ctx.body.user.access &&
    (ctx.body.user.access.indexOf(USER_ACCESS_REAFFECTATOR_READER) !== -1 || ctx.body.user.access.indexOf(USER_ACCESS_REAFFECTATOR_WRITER) !== -1)
  )
}

/**
 * Model d'export
 */
export const Access = {
  isExist,
  isLogin,
  isAdmin,
  isSuperAdmin,
  canVewHR,
  canVewCalculator,
  canVewActivities,
  canVewSimulation,
  canVewContentieuxOptions,
  canVewWhiteSimulation,
  canVewReaffectator,
  canEditWhiteSimulation,
  canEditReaffectator,
  canEditSimulation,
  canEditActivities,
  canEditContentieuxOptions,
  canEditCalculator,
  canEditHR,
}
