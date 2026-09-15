import { Types } from '../utils/types'
import Route, { Access } from './Route'

/**
 * Route des juridictions
 */
export default class RouteJuridictionsDetails extends Route {
  // model de BDD
  model

  /**
   * Constructeur
   * @param {*} params
   */
  constructor(params) {
    super(params)

    this.model = params.models.TJDetails
  }

  /**
   * Interface qui retourne les CLEs concernant une juridiction
   */
  @Route.Post({
    bodyType: Types.object().keys({
      juridictionId: Types.number().required(),
    }),
    accesses: [Access.isLogin],
  })
  async getCle(ctx) {
    let { juridictionId } = this.body(ctx)

    if (await this.models.HRBackups.haveAccess(juridictionId, ctx.state.user.id)) {
      const list = await this.model.getCle(juridictionId)
      this.sendOk(ctx, list)
    } else {
      ctx.throw(403, "Vous n'avez pas accès")
    }
  }

  /**
   * Modification d'une CLE de juridiction
   * @param {*} node
   * @param {*} juridictionId
   */
  @Route.Put({
    bodyType: Types.object().keys({
      juridictionId: Types.number().required(),
      categoryId: Types.number().required(),
      value: Types.any().required(),
    }),
    accesses: [Access.isLogin],
  })
  async updateCle(ctx) {
    const { juridictionId, categoryId, value } = this.body(ctx)

    if (await this.models.HRBackups.haveAccess(juridictionId, ctx.state.user.id)) {
      await this.model.updateCle(juridictionId, categoryId, value)
      this.sendOk(ctx, 'Ok')
    } else {
      ctx.throw(403, "Vous n'avez pas accès")
    }
  }
}
