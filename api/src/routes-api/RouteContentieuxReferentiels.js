import Route, { Access } from './Route'
import { Types } from '../utils/types'

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
  @Route.Post({
    bodyType: Types.object().keys({
      isJirs : Types.boolean(),
    }),
    accesses: [Access.isAdmin],
  })
  async getReferentiels (ctx) {
    const { isJirs } = this.body(ctx)
    this.sendOk(ctx, await this.models.ContentieuxReferentiels.getReferentiels(isJirs, true))
  }

  /**
   * Interface pour modifier un referentiel
   */
  @Route.Put({
    bodyType: Types.object().keys({
      id: Types.number().required(),
      node: Types.string().required(),
      value: Types.any().required(),
    }),
    accesses: [Access.isAdmin],
  })
  async update (ctx) {
    const { id, node, value } = this.body(ctx)
    await this.models.ContentieuxReferentiels.updateRef(id, node, value)

    this.sendOk(ctx, 'Ok')
  }
}
