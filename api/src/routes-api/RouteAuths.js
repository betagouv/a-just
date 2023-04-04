import Route from './Route'
import { crypt } from '../utils'
import { Types } from '../utils/types'
import { USER_ROLE_ADMIN, USER_ROLE_SUPER_ADMIN } from '../constants/roles'
import { USER_AUTO_LOGIN, USER_USER_LOGIN } from '../constants/log-codes'

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
    const { password } = this.body(ctx)
    let { email } = this.body(ctx)
    email = (email || '').toLowerCase()

    const user = await this.model.findOne({ where: { email } })
    if (user && user.dataValues.status === 0) {
      ctx.throw(401, ctx.state.__("Votre compte n'est plus accessible."))
    } else if (user && crypt.compartPassword(password, user.dataValues.password)) {
      delete user.dataValues.password

      await ctx.loginUser(user.dataValues)
      await this.models.Logs.addLog(USER_USER_LOGIN, user.dataValues.id, { userId: user.dataValues.id })
      await super.addUserInfoInBody(ctx)
      this.sendCreated(ctx)
    } else {
      ctx.throw(401, ctx.state.__('Email ou mot de passe incorrect'))
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
    const { password } = this.body(ctx)
    let { email } = this.body(ctx)
    email = (email || '').toLowerCase()

    console.log('TEST', password, email)

    const user = await this.model.findOne({ where: { email, role: [USER_ROLE_ADMIN, USER_ROLE_SUPER_ADMIN] } })
    if (user && user.dataValues.status === 0) {
      ctx.throw(401, ctx.state.__("Votre compte n'est plus accessible."))
    } else if (user && crypt.compartPassword(password, user.dataValues.password)) {
      delete user.dataValues.password

      await ctx.loginUser(user.dataValues)
      await super.addUserInfoInBody(ctx)
      this.sendCreated(ctx)
    } else {
      ctx.throw(401, ctx.state.__('Email ou mot de passe incorrect'))
    }
  }

  /**
   * Interface de control de qui est connecté
   */
  @Route.Get({})
  async autoLogin (ctx) {
    if (this.userId(ctx)) {
      await super.addUserInfoInBody(ctx)
      await this.models.Logs.addLog(USER_AUTO_LOGIN, ctx.state.user.id, { userId: ctx.state.user.id })
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
