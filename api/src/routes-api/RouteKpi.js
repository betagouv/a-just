import Route from './Route'
import { Types } from '../utils/types'

export default class RouteKpi extends Route {
  constructor (params) {
    super({ ...params, model: 'Logs' })
  }

  @Route.Post({
    bodyType: Types.object().keys({
      type: Types.number(),
      value: Types.any(),
    }),
  })
  async call (ctx) {
    const { type, value } = this.body(ctx)
    await this.models.Logs.addLog(type, ctx && ctx.state && ctx.state.user && ctx.state.user.id ? ctx.state.user.id : null, value, { formatValue: false })
  }
}
