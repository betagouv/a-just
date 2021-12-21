import Route from './Route'
import { crypt } from '../utils'
import { Types } from '../utils/types'
import { USER_ROLE_ADMIN } from '../constants/roles'

export default class RouteAuths extends Route {
  constructor (params) {
    super({ ...params, model: 'Users' })
  }

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
    if(user && user.dataValues.status === 0) {
      ctx.throw(401, ctx.state.__('Votre compte n\'est plus accessible.'))
    } else if (user && crypt.compartPassword(password, user.dataValues.password)) {
      delete user.dataValues.password

      await ctx.loginUser(user.dataValues)
      await super.addUserInfoInBody(ctx)
      this.sendCreated(ctx)
    } else {
      ctx.throw(401, ctx.state.__('Email ou mot de passe incorrect'))
    }
  }

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

    const user = await this.model.findOne({ where: { email, role: USER_ROLE_ADMIN } })
    if(user && user.dataValues.status === 0) {
      ctx.throw(401, ctx.state.__('Votre compte n\'est plus accessible.'))
    } else if (user && crypt.compartPassword(password, user.dataValues.password)) {
      delete user.dataValues.password

      await ctx.loginUser(user.dataValues)
      await super.addUserInfoInBody(ctx)
      this.sendCreated(ctx)
    } else {
      ctx.throw(401, ctx.state.__('Email ou mot de passe incorrect'))
    }
  }

  @Route.Get({})
  async autoLogin (ctx) {
    if (this.userId(ctx)) {
      await super.addUserInfoInBody(ctx)
      this.sendOk(ctx)
    } else {
      ctx.throw(401)
    }
  }

  @Route.Get({})
  async autoLoginAdmin (ctx) {
    if (this.userId(ctx) && ctx.state.user.role === USER_ROLE_ADMIN) {
      await super.addUserInfoInBody(ctx)
      this.sendOk(ctx)
    } else {
      ctx.throw(401)
    }
  }

  @Route.Get({})
  async logout (ctx) {
    await ctx.logoutUser()
  }
}
