import Route, { Access } from './Route'
import { Types } from '../utils/types'

/**
 * Route de la gestion des utilisateurs
 */
export default class RouteContentieuxReferentiels extends Route {
  // model de BDD
  model

  /**
   * Constructeur
   * @param {*} params
   */
  constructor(params) {
    super(params)

    this.model = params.models.ContentieuxReferentiels
  }

  /**
   * Interface pour avoir une liste des données standard d'un utilisateur connecté
   */
  @Route.Post({
    bodyType: Types.object().keys({
      backupId: Types.number(),
      isJirs: Types.boolean(),
    }),
    accesses: [Access.isLogin],
  })
  async getReferentiels(ctx) {
    const { backupId, isJirs } = this.body(ctx)
    const userPreview = await this.models.Users.userPreview(ctx.state.user.id)
    this.sendOk(ctx, {
      referentiels: await this.models.ContentieuxReferentiels.getReferentiels(backupId || null, isJirs || null, null, false, false, ctx.state.user.id),
      referentielsComplete: await this.models.ContentieuxReferentiels.getReferentiels(backupId || null, isJirs || null, null, false, false),
      isComplete: userPreview.referentielIds === null ? true : false,
    })
  }

  /**
   * Interface pour avoir une liste des referentiels
   */
  @Route.Post({
    bodyType: Types.object().keys({
      isJirs: Types.boolean(),
    }),
    accesses: [Access.isAdmin],
  })
  async getAllReferentiels(ctx) {
    const { isJirs } = this.body(ctx)
    this.sendOk(ctx, await this.models.ContentieuxReferentiels.getReferentiels(null, isJirs || null))
  }

  /**
   * Interface pour modifier un referentiel
   */
  @Route.Put({
    bodyType: Types.object().keys({
      id: Types.number().required(),
      node: Types.string().required(),
      value: Types.any(),
    }),
    accesses: [Access.isAdmin],
  })
  async update(ctx) {
    const { id, node, value } = this.body(ctx)
    await this.models.ContentieuxReferentiels.updateRef(id, node, value || null)

    this.sendOk(ctx, 'Ok')
  }
}
