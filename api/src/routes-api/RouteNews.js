import Route, { Access } from './Route'
import { Types } from '../utils/types'

export default class RouteNews extends Route {
  constructor (params) {
    super({ ...params, model: 'News' })
  }

  @Route.Get({
    accesses: [Access.isLogin],
  })
  async last (ctx) {
    //await this.model.updateBy(contentieuxId, date, values, hrBackupId, ctx.state.user.id, nodeUpdated)
    this.sendOk(
      ctx,
      /*{
      html: 'ceci est un test',
      icon: 'error-warning-line',
      backgroundColor: 'red',
      textColor: 'blue',
      delayBeforeAutoClosing: 5000,
      actionButtonText: 'test',
      actionButtonUrl: 'https://www.google.fr',
      actionButtonColor: 'green',
    }*/ null
    )
  }

  @Route.Post({
    bodyType: Types.object().keys({
      id: Types.any(),
    }),
    accesses: [Access.isLogin],
  })
  async onClose (ctx) {
    const { id } = this.body(ctx)

    this.sendOk(ctx, 'OK')
  }
}
