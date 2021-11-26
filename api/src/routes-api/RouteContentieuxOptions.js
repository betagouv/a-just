import Route, { Access } from './Route'

export default class RouteContentieuxOptions extends Route {
  constructor (params) {
    super({ ...params, model: 'ContentieuxOptions' })
  }

  @Route.Get({
    accesses: [Access.isLogin],
  })
  async getAll (ctx) {
    const list = await this.model.getAll()

    this.sendOk(ctx, {
      list,
    })
  }
}
