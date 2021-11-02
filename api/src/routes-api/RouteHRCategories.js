import Route, { Access } from './Route'

export default class RouteHrCategories extends Route {
  constructor (params) {
    super({ ...params, model: 'HRCategories' })
  }

  @Route.Get({
    accesses: [Access.isLogin],
  })
  async getAll (ctx) {
    this.sendOk(ctx, await this.model.getAll())
  }
}
