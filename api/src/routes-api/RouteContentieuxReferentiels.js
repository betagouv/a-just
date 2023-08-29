import Route, { Access } from './Route'

/**
 * Route de la gestion des utilisateurs
 */
export default class RouteContentieuxReferentiels extends Route {
  /**
   * Constructeur
   * @param {*} params
   */
  constructor (params) {
    super({ ...params, model: 'ContentieuxReferentiels' })
  }

  /**
   * Interface pour avoir une liste des données standard d'un utilisateur connecté
   */
  @Route.Get({
    accesses: [Access.isAdmin],
  })
  async getReferentiels (ctx) {
    this.sendOk(ctx, await this.models.ContentieuxReferentiels.getReferentiels())
  }
}
