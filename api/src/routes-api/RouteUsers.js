import Route from './Route'
import { Types } from '../utils/types'

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
    } catch(err) {
      ctx.throw(401, err)
    }
  }
}
