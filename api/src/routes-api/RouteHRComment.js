import Route, { Access } from './Route'
import { Types } from '../utils/types'

/**
 * Route des commentaires
 */

export default class RouteHrComment extends Route {
  /**
   * Constructeur
   * @param {*} params
   */
  constructor (params) {
    super({ ...params, model: 'HRComments' })
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
   * Interface de modification d'un commentaire d'une fiche
   * @param {*} hrId
   * @param {*} comment
   */
  @Route.Post({
    bodyType: Types.object().keys({
      hrId: Types.number().required(),
      comment: Types.string().required(),
    }),
    accesses: [Access.canVewHR],
  })
  async updateHrComment (ctx) {
    const { hrId, comment } = this.body(ctx)
    if (await this.models.HumanResources.haveAccess(hrId, ctx.state.user.id)) {
      this.sendOk(ctx, await this.model.updateComment(hrId, comment))
    } else {
      this.sendOk(ctx, null)
    }
  }
}
