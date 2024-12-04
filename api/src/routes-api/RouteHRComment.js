import Route, { Access } from './Route'
import { Types } from '../utils/types'

/**
 * Route des commentaires
 */

export default class RouteHrComment extends Route {
  // model de BDD
  model

  /**
   * Constructeur
   * @param {*} params
   */
  constructor (params) {
    super(params)

    this.model = params.models.HRComments
  }

  /**
   * Interface de retour d'un commentaire d'une fiche
   * @param {*} hrId
   */
  @Route.Post({
    bodyType: Types.object().keys({
      hrId: Types.number().required(),
    }),
    accesses: [Access.canVewHR],
  })
  async getHrComment (ctx) {
    const { hrId } = this.body(ctx)
    if (await this.models.HumanResources.haveAccess(hrId, ctx.state.user.id)) {
      this.sendOk(ctx, await this.model.getComment(hrId))
    } else {
      this.sendOk(ctx, null)
    }
  }

  /**
   * Interface de retour d'un commentaire d'une fiche
   * @param {*} hrId
   */
  @Route.Post({
    bodyType: Types.object().keys({
      id: Types.number().required(),
      hrId: Types.number().required(),
    }),
    accesses: [Access.canVewHR],
  })
  async getHrCommentById (ctx) {
    const { id, hrId } = this.body(ctx)
    if (await this.models.HumanResources.haveAccess(hrId, ctx.state.user.id)) {
      this.sendOk(ctx, await this.model.getCommentById(id))
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
      hrId: Types.number().required(),
      comment: Types.string().required(),
      userId: Types.number().required(),
      commentId: Types.number().required(),
    }),
    accesses: [Access.canVewHR],
  })
  async updateHrComment (ctx) {
    const { hrId, comment, userId, commentId } = this.body(ctx)
    if (await this.models.HumanResources.haveAccess(hrId, ctx.state.user.id)) {
      this.sendOk(ctx, await this.model.updateComment(hrId, comment, userId, commentId))
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
      hrId: Types.number().required(),
      commentId: Types.number().required(),
    }),
    accesses: [Access.canVewHR],
  })
  async deleteHrComment (ctx) {
    const { hrId, commentId } = this.body(ctx)
    if (await this.models.HumanResources.haveAccess(hrId, ctx.state.user.id)) {
      this.sendOk(ctx, await this.model.deleteComment(commentId, hrId))
    } else {
      this.sendOk(ctx, null)
    }
  }
}
