import Route from './Route'

/**
 * Route des fonctions (VP, 1VP, ...)
 */

export default class RouteHrFonctions extends Route {
  // model de BDD
  model

  /**
   * Constructeur
   * @param {*} params
   */
  constructor (params) {
    super(params)

    this.model = params.models.HRFonctions
  }

  /**
   * Interface de la liste de toutes les fonctions
   */
  @Route.Get({})
  async getAll (ctx) {
    this.sendOk(ctx, await this.model.getAll())
  }
}
