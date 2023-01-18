import { Route as RouteBase } from 'koa-smart'
import { USER_ROLE_ADMIN } from '../constants/roles'
import { logError } from '../utils/log'
import { snakeToCamelObject } from '../utils/utils'

/**
 * Class autour de la l'authentification et des droits
 */
export default class Route extends RouteBase {
  /**
   * Constructeur
   * @param {*} params
   */
  constructor (params) {
    super(params)
  }

  /**
   * Function de controle des erreurs utilisateur
   * @param {*} ctx
   * @param {*} infos
   * @param {*} next
   */
  async beforeRoute (ctx, infos, next) {
    // the "beforeRoute" function is executed before any call to a route belonging to the same class
    // (or a class ihneriting from it) is made.
    try {
      // force to load user access
      await this.addUserInfoInBody(ctx)

      await super.beforeRoute(ctx, infos, next)
    } catch (e) {
      logError(e)
      throw e
    }
  }

  /**
   * Fonction qui retourne l'utilisateur connecté
   * @param {*} ctx
   * @returns
   */
  user (ctx) {
    return ctx.state.user
  }

  /**
   * Fonction qui retourne l'id de l'utilisateur connecté
   * @param {*} ctx
   * @returns
   */
  userId (ctx) {
    return this.user(ctx) ? this.user(ctx).id : null
  }

  /**
   * Fonction pour récupérer l'ensemble de l'utilisateur connecté
   * @param {*} ctx
   * @param {*} id
   * @returns
   */
  async addUserInfoInBody (ctx, id) {
    if (!id && ctx.state.user) {
      id = ctx.state.user.id
    }
    this.assertUnauthorized(id)

    let user = await this.models.Users.findOne({
      attributes: ['id', 'email', 'role', 'first_name', 'last_name'],
      where: {
        id,
        status: 1,
      },
      raw: true,
    })
    user = { ...user, ...snakeToCamelObject(user), access: await this.models.UsersAccess.getUserAccess(id) }
    this.assertUnauthorized(user)
    ctx.body.user = user
    ctx.state.user = user // force to add to state with regenerated access

    return user
  }

  /**
   * Fonction pour retourner si l'utilisateur connecté est administrateur
   * @param {*} ctx
   * @returns
   */
  isAdmin (ctx) {
    return isAdmin(ctx)
  }
}

/**
 * Control si l'utilisateur existe
 * @param {*} ctx
 * @returns
 */
function isLogin (ctx) {
  return !!ctx.state.user
}

/**
 * Contril si l'utilisateur est de type Admin
 * @param {*} ctx
 * @returns
 */
function isAdmin (ctx) {
  return !!ctx.state.user && ctx.state.user.role === USER_ROLE_ADMIN
}

/**
 * Control si l'utilisateur des accès de Ventilation
 * @param {*} ctx
 * @returns
 */
function canVewHR (ctx) {
  return !!ctx.state.user && ctx.state.user.access && ctx.state.user.access.indexOf(2) !== -1
}

/**
 * Control si l'utiliusateur des accès d'Activitiés
 * @param {*} ctx
 * @returns
 */
function canVewActivities (ctx) {
  return !!ctx.state.user && ctx.state.user.access && ctx.state.user.access.indexOf(3) !== -1
}

/**
 * Control si l'utiliusateur des accès de temps moyen
 * @param {*} ctx
 * @returns
 */
function canVewContentieuxOptions (ctx) {
  return !!ctx.state.user && ctx.state.user.access && ctx.state.user.access.indexOf(4) !== -1
}

/**
 * Model d'export
 */
export const Access = {
  isLogin,
  isAdmin,
  canVewHR,
  canVewActivities,
  canVewContentieuxOptions,
}
