import { getCategoriesByUserAccess } from '../utils/hr-catagories'
import Route, { Access } from './Route'

/**
 * Route pour lister des categories (magistrats, greffier...)
 */

export default class RouteHrCategories extends Route {
  // model de BDD
  model

  /**
   * Constructeur
   * @param {*} params
   */
  constructor (params) {
    super(params)

    this.model = params.models.HRCategories
  }

  /**
   * Interface liste des toutes les catégories
   */
  @Route.Get({
    accesses: [Access.isLogin],
  })
  async getAll (ctx) {
    this.sendOk(ctx, getCategoriesByUserAccess(await this.model.getAll(), ctx.state.user))
  }
}
