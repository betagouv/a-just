import Route from './Route'
import { Types } from '../utils/types'
import { USER_ROLE_ADMIN, USER_ROLE_SUPER_ADMIN, USER_ROLE_TEAM } from '../constants/roles'
import { USER_AUTO_LOGIN, USER_USER_LOGIN } from '../constants/log-codes'
import * as Sentry from '@sentry/node'

/**
 * Route des authentification
 */
export default class RouteAuths extends Route {
  /**
   * Constructeur
   * @param {*} params
   */
  constructor (params) {
    super({ ...params, model: 'Users' })
  }

  /**
   * Interface de connexion utilisateur
   * @param {*} email
   * @param {*} password
   */
  @Route.Post({
    bodyType: Types.object().keys({
      email: Types.string().required(),
      password: Types.string().required(),
    }),
  })
  async login (ctx) {
    const { password, email } = this.body(ctx)
    console.log('[RouteAuths.js][line 32] email: |', email, '|')
    console.log('[RouteAuths.js][line 33] password: |', password, '|')
    const tryUserCon = await this.model.tryConnection(email, password, [0, null, USER_ROLE_TEAM, USER_ROLE_ADMIN, USER_ROLE_SUPER_ADMIN])
    console.log('[RouteAuths.js][line 35] tryUserCon: |', tryUserCon, '|')
    if (typeof tryUserCon === 'string') {
      ctx.throw(401, tryUserCon)
    } else {
      await ctx.loginUser(tryUserCon)
      await this.models.Logs.addLog(USER_USER_LOGIN, tryUserCon.id, {
        userId: tryUserCon.id,
      })
      await super.addUserInfoInBody(ctx)
      this.sendCreated(ctx)
    }
  }

  /**
   * Interface de connexion administrateur
   * @param {*} email
   * @param {*} password
   */
  @Route.Post({
    bodyType: Types.object().keys({
      email: Types.string().required(),
      password: Types.string().required(),
    }),
  })
  async loginAdmin (ctx) {
    const { password, email } = this.body(ctx)

    const tryUserCon = await this.model.tryConnection(email, password, [USER_ROLE_ADMIN, USER_ROLE_SUPER_ADMIN])
    console.log('tryUserCon:')
    if (typeof tryUserCon === 'string') {
      ctx.throw(401, tryUserCon)
    } else {
      await ctx.loginUser(tryUserCon)
      await this.models.Logs.addLog(USER_USER_LOGIN, tryUserCon.id, {
        userId: tryUserCon.id,
      })
      await super.addUserInfoInBody(ctx)
      this.sendCreated(ctx)
    }
  }

  /**
   * Interface de control de qui est connecté
   */
  @Route.Get({})
  async autoLogin (ctx) {
    if (this.userId(ctx)) {
      await super.addUserInfoInBody(ctx)
      await this.models.Logs.addLog(USER_AUTO_LOGIN, ctx.state.user.id, {
        userId: ctx.state.user.id,
      })

      const transaction = Sentry.startTransaction({ name: 'Logingg' })
      Sentry.getCurrentHub().configureScope((scope) => scope.setSpan(transaction))
      const span = transaction.startChild({
        data: {
          res: '',
        },
        op: 'task',
        description: 'auto loging',
      })
      span.finish() // Remember that only finished spans will be sent with the transaction
      transaction.finish()
      this.sendOk(ctx)
    } else {
      ctx.throw(401)
    }
  }

  /**
   * Interface de control de qui est l'administrateur connecté
   */
  @Route.Get({})
  async autoLoginAdmin (ctx) {
    if (this.userId(ctx) && [USER_ROLE_ADMIN, USER_ROLE_SUPER_ADMIN].indexOf(ctx.state.user.role) !== -1) {
      await super.addUserInfoInBody(ctx)
      this.sendOk(ctx)
    } else {
      ctx.throw(401)
    }
  }

  /**
   * Suppression du token de l'utilisateur connecté
   */
  @Route.Get({})
  async logout (ctx) {
    await ctx.logoutUser()
  }
}
