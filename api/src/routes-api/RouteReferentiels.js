import Route, { Access } from './Route'

export default class RouteReferentiels extends Route {
  constructor (params) {
    super({ ...params, model: 'ContentieuxReferentiels' })
  }

  @Route.Get({
    accesses: [Access.isLogin],
  })
  async getReferentiels (ctx) {
    const list = await this.model.getReferentiels()

    this.sendOk(ctx, list)
  }
}
