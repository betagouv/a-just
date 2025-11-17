import Route, { Access } from './Route'
import { Types } from '../utils/types'

/**
 * Route des commentaires globaux
 */

export default class RouteComment extends Route {
  // model de BDD
  model

  /**
   * Constructeur
   * @param {*} params
   */
  constructor(params) {
    super(params)

    this.model = params.models.Comments
  }

  /**
   * Interface de retour des commentaires en fonction d'un type
   * @param {*} hrId
   */
  @Route.Post({
    bodyType: Types.object().keys({
      type: Types.string().required(),
      juridictionId: Types.number().required(),
    }),
    accesses: [Access.canVewActivities],
  })
  async getComments(ctx) {
    const { type, juridictionId } = this.body(ctx)
    if (await this.models.HRBackups.haveAccess(juridictionId, ctx.state.user.id)) {
      this.sendOk(ctx, await this.model.getComments(type, juridictionId))
    } else {
      this.sendOk(ctx, [])
    }
  }

  /**
   * Interface de modification d'un commentaire d'une fiche
   * @param {*} hrId
   * @param {*} comment
   */
  @Route.Post({
    bodyType: Types.object().keys({
      type: Types.string().required(),
      juridictionId: Types.number().required(),
      comment: Types.string().required(),
      commentId: Types.number(),
    }),
    accesses: [Access.canEditActivities],
  })
  async updateComment(ctx) {
    const { type, juridictionId, comment, commentId } = this.body(ctx)
    if (await this.models.HRBackups.haveAccess(juridictionId, ctx.state.user.id)) {
      this.sendOk(ctx, await this.model.updateComment(type, juridictionId, comment, ctx.state.user.id, commentId))
    } else {
      this.sendOk(ctx, null)
    }
  }

  /**
   * Interface de modification d'un commentaire d'une fiche
   * @param {*} hrId
   * @param {*} comment
   */
  @Route.Post({
    bodyType: Types.object().keys({
      commentId: Types.number().required(),
      juridictionId: Types.number().required(),
    }),
    accesses: [Access.canEditActivities],
  })
  async deleteComment(ctx) {
    const { juridictionId, commentId } = this.body(ctx)
    if (await this.models.HRBackups.haveAccess(juridictionId, ctx.state.user.id)) {
      this.sendOk(ctx, await this.model.deleteComment(commentId, juridictionId))
    } else {
      this.sendOk(ctx, null)
    }
  }
}
