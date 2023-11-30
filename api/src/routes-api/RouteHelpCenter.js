import Route, { Access } from './Route'
import { Types } from '../utils/types'
import { EXECUTE_HELPCENTER, EXECUTE_HELPCENTER_LINK, EXECUTE_HELPCENTER_SEARCH } from '../constants/log-codes'

/**
 * Route des juridictions
 */
export default class RouteCentreDAide extends Route {
  /**
   * Constructeur
   * @param {*} params
   */
  constructor(params) {
    super({ ...params })
  }


  /**
   * Log cente
   * @param {*} node
   * @param {*} juridictionId
   */
  @Route.Post({
    bodyType: Types.object().keys({
      value: Types.any().required(),
    }),
    accesses: [Access.isLogin],
  })
  async logDocumentationRecherche(ctx) {
    const { value } = this.body(ctx)
    await this.models.Logs.addLog(EXECUTE_HELPCENTER_SEARCH, ctx.state.user.id, { recherche: value })
    this.sendOk(ctx, 'Ok')
  }
  /**
 * Log cente
 * @param {*} node
 * @param {*} juridictionId
 */
  @Route.Post({
    bodyType: Types.object().keys({
      value: Types.any().required(),
    }),
    accesses: [Access.isLogin],
  })
  async logDocumentationLink(ctx) {
    const { value } = this.body(ctx)
    await this.models.Logs.addLog(EXECUTE_HELPCENTER_LINK, ctx.state.user.id, { url: value })
    this.sendOk(ctx, 'Ok')
  }

  /**
* Log cente
* @param {*} node
* @param {*} juridictionId
*/
  @Route.Post({
    accesses: [Access.isLogin],
  })
  async logDocumentation(ctx) {
    await this.models.Logs.addLog(EXECUTE_HELPCENTER, ctx.state.user.id)
    this.sendOk(ctx, 'Ok')
  }
}
