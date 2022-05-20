import Route from './Route'

export default class RouteLogs extends Route {
  constructor (params) {
    super({ ...params, model: 'Logs' })
  }

  @Route.Get({
    routeBase: '',
  })
  async system (ctx) {
    ctx.type = 'text/csv'
    ctx.body = await this.model.getCsvLogs()
  }
}
