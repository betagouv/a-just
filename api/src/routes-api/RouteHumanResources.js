import Route/*, { Access }*/ from './Route'

export default class RouteHumanResources extends Route {
  constructor (params) {
    super({ ...params, model: 'humanresources' })
  }

  @Route.Get({
    //accesses: [Access.isAdmin],
  })
  async getAll (ctx) {
    this.sendOk(ctx, [])
  }
}
