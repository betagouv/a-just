import Route, { Access } from './Route'

/**
 * Route des fonctions (VP, 1VP, ...)
 */

export default class RouteHrFonctions extends Route {
  /**
   * Constructeur
   * @param {*} params
   */
  constructor (params) {
    super({ ...params, model: 'HRFonctions' })
  }

  /**
   * Interface de la liste de toutes les fonctions
   */
  @Route.Get({
    accesses: [Access.isLogin],
  })
  async getAll (ctx) {
    this.sendOk(ctx, await this.model.getAll())
  }
}
