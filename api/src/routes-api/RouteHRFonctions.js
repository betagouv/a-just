import Route, { Access } from './Route'

export default class RouteHrFonctions extends Route {
  constructor (params) {
    super({ ...params, model: 'HRFonctions' })
  }

  @Route.Get({
    accesses: [Access.isLogin],
  })
  async getAll (ctx) {
    this.sendOk(ctx, await this.model.getAll())
  }
}
