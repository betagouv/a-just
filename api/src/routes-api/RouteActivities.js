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
    // const list = await this.model.getAll()

    this.sendOk(ctx, {
      activities: [
        {
          contentieux: { id: 465 },
          entrees: 10,
          periode: new Date(2021, 9),
          sorties: 20,
          stock: 30,
        },
        {
          contentieux: { id: 465 },
          entrees: 40,
          periode: new Date(2021, 10),
          sorties: 50,
          stock: 60,
        },
        {
          contentieux: { id: 465 },
          entrees: 70,
          periode: new Date(2021, 11),
          sorties: 80,
          stock: 90,
        },
        {
          contentieux: { id: 466 },
          entrees: 40,
          periode: new Date(2021, 11),
          sorties: 40,
          stock: 80,
        },
        {
          contentieux: { id: 497 },
          entrees: 30,
          periode: new Date(2021, 11),
          sorties: 40,
          stock: 10,
        },
      ],
      activityMonth: new Date(2021, 11),
    })
  }
}
