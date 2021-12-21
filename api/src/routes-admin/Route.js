import { Route as RouteBase } from 'koa-smart'
import { USER_ROLE_ADMIN } from '../constants/roles'
import { logError } from '../utils/log'
import { snakeToCamelObject } from '../utils/utils'

export default class Route extends RouteBase {
  constructor (params) {
    super(params)
  }

  async beforeRoute (ctx, infos, next) {
    // the "beforeRoute" function is executed before any call to a route belonging to the same class
    // (or a class ihneriting from it) is made.
    try {
      await super.beforeRoute(ctx, infos, next)
    } catch (e) {
      logError(e)
      throw e
    }
  }

  user (ctx) {
    return ctx.state.user
  }
  userId (ctx) {
    return this.user(ctx) ? this.user(ctx).id : null
  }

  async addUserInfoInBody (ctx, id) {
    if (!id && ctx.state.user) {
      id = ctx.state.user.id
    }
    this.assertUnauthorized(id)

    let user = await this.models.users.findOne({ attributes: ['id', 'email', 'role', 'first_name', 'last_name'], where: {
      id,
      status: 1,
    }, raw: true })
    user = { ...user, ...snakeToCamelObject(user), access: await this.models.UsersAccess.getUserAccess(id) }
    this.assertUnauthorized(user)
    ctx.body.user = user

    return user
  }

  isAdmin (ctx) {
    return isAdmin(ctx)
  }
}

async function isLogin (ctx) {
  return !!ctx.state.user
}

function isAdmin (ctx) {
  return !!ctx.state.user && ctx.state.user.role === USER_ROLE_ADMIN
}

export const Access = {
  isLogin,
  isAdmin,
}
