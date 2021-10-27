import Route, { Access } from './Route'

export default class RouteActivities extends Route {
  constructor (params) {
    super({ ...params, model: 'Activities' })
  }

  @Route.Get({
    accesses: [Access.isLogin],
  })
  async getActivitiesGrouped (ctx) {
    const list = await this.model.getActivitiesGrouped()

    this.sendOk(ctx, list)
  }
}
