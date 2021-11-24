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

  @Route.Get({
    accesses: [Access.isLogin],
  })
  async getAll (ctx) {
    const list = await this.model.getAll()

    this.sendOk(ctx, {
      activities: list,
      activityMonth: new Date(2021, 10),
    })
  }
}
