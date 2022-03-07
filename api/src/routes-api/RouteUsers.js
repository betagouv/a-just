import Route, { Access } from './Route'
import { Types } from '../utils/types'
import {
  accessList,
} from '../constants/access'

export default class RouteUsers extends Route {
  constructor (params) {
    super({ ...params, model: 'Users' })
  }

  @Route.Get()
  async me (ctx) {
    if (ctx.state && ctx.state.user) {
      const user = await this.model.userPreview(ctx.state.user.id)
      this.sendOk(ctx, user)
    } else {
      this.sendOk(ctx, null)
    }
  }

  @Route.Post({
    bodyType: Types.object().keys({
      email: Types.string().required(),
      password: Types.string().required(),
      firstName: Types.string(),
      lastName: Types.string(),
    }),
  })
  async createAccount (ctx) {
    try {
      await this.model.createAccount(this.body(ctx))
      this.sendOk(ctx, 'OK')
    } catch (err) {
      ctx.throw(401, err)
    }
  }

  @Route.Get({
    accesses: [Access.isAdmin],
  })
  async getAll (ctx) {
    const list = await this.model.getAll()

    this.sendOk(ctx, {
      list,
      ventilations: await this.model.models.HRBackups.getAll(),
      access: accessList,
    })
  }

  @Route.Post({
    bodyType: Types.object().keys({
      userId: Types.number().required(),
      access: Types.any().required(),
      ventilations: Types.any().required(),
    }),
    accesses: [Access.isAdmin],
  })
  async updateAccount (ctx) {
    try {
      await this.model.updateAccount(this.body(ctx))
      this.sendOk(ctx, 'OK')
    } catch (err) {
      ctx.throw(401, err)
    }
  }
}
