import Route, { Access } from './Route'
import { Types } from '../utils/types'

/**
 * Route des avis utilisateurs
 */
export default class RouteFeedback extends Route {
  model

  constructor(params) {
    super(params)

    this.model = params.models.UserFeedback
  }

  @Route.Get({
    accesses: [Access.isLogin],
  })
  async status(ctx) {
    const row = await this.model.hasResponded(ctx.state.user.id)

    this.sendOk(ctx, { hasResponded: !!row })
  }

  @Route.Post({
    bodyType: Types.object().keys({
      rating: Types.number().min(1).max(5).required(),
      comment: Types.string(),
      page: Types.string(),
    }),
    accesses: [Access.isLogin],
  })
  async submit(ctx) {
    const body = this.body(ctx)

    await this.model.submit(ctx.state.user.id, body)

    this.sendOk(ctx, 'OK')
  }
}
