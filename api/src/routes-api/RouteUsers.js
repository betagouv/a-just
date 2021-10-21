import Route from './Route'

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
}
