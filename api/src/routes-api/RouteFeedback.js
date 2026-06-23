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
      rating: Types.number(),
      comment: Types.string(),
      page: Types.string(),
    }),
    accesses: [Access.isLogin],
  })
  async submit(ctx) {
    const { rating, comment, page } = this.body(ctx)

    if (typeof rating !== 'number' || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      ctx.throw(400, 'La note doit être un entier entre 1 et 5')
    }

    await this.model.submit(ctx.state.user.id, { rating, comment, page })

    this.sendOk(ctx, 'OK')
  }
}
