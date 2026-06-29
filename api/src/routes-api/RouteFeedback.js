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
    this.sendOk(ctx, await this.model.getStatus(ctx.state.user.id))
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

  @Route.Get({
    accesses: [Access.isAdmin],
  })
  async getAll(ctx) {
    this.sendOk(ctx, await this.model.getAll())
  }

  @Route.Get({
    accesses: [Access.isAdmin],
  })
  async stats(ctx) {
    this.sendOk(ctx, await this.model.getStats())
  }
}
