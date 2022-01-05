import Route, { Access } from './Route'

export default class RouteJuridictions extends Route {
  constructor (params) {
    super({ ...params, model: 'Juridictions' })
  }

  @Route.Get({
    accesses: [Access.isAdmin],
  })
  async getBackupList (ctx) {
    this.sendOk(ctx, await this.model.getAll())
  }
}
