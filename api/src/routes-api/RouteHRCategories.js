import { getCategoriesByUserAccess } from '../utils/hr-catagories'
import Route, { Access } from './Route'

/**
 * Route pour lister des categories (magistrats, greffier...)
 */

export default class RouteHrCategories extends Route {
  /**
   * Constructeur
   * @param {*} params
   */
  constructor (params) {
    super({ ...params, model: 'HRCategories' })
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
