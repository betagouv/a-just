import Route, { Access } from './Route'

export default class RouteHumanResources extends Route {
  constructor (params) {
    super({ ...params, model: 'HumanResources' })
  }

  @Route.Get({
    accesses: [Access.isLogin],
  })
  async getCurrentHr (ctx) {
    this.sendOk(ctx, {
      hr: await this.model.getCurrentHr(),
      contentieuxReferentiel: await this.model.models.ContentieuxReferentiels.getMainTitles(),
    })
  }
}
