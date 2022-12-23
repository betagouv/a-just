import Route, { Access } from './Route'
import { Types } from '../utils/types'

/**
 * Route des news
 */
export default class RouteNews extends Route {
  /**
   * Constructeur
   * @param {*} params
   */
  constructor (params) {
    super({ ...params, model: 'News' })
  }

  /**
   * Interface de la dernière news pour un utilisateur
   */
  @Route.Get({
    accesses: [Access.isLogin],
  })
  async last (ctx) {
    //await this.model.updateBy(contentieuxId, date, values, hrBackupId, ctx.state.user.id, nodeUpdated)
    this.sendOk(
      ctx,
      /*{
      html: 'ceci est un test',
      icon: 'error-warning-line',
      backgroundColor: 'red',
      textColor: 'blue',
      delayBeforeAutoClosing: 5000,
      actionButtonText: 'test',
      actionButtonUrl: 'https://www.google.fr',
      actionButtonColor: 'green',
    }*/ null
    )
  }

  /**
   * Interface qui informe qui un utilisateur ferme une news
   * @param {*} id
   */
  @Route.Post({
    bodyType: Types.object().keys({
      id: Types.any(),
    }),
    accesses: [Access.isLogin],
  })
  async onClose (ctx) {
    const { id } = this.body(ctx)

    this.sendOk(ctx, 'OK')
  }

  /**
   * Interface de toutes les news disponibles
   */
  @Route.Get({
    accesses: [Access.isAdmin],
  })
  async getAll (ctx) {
    this.sendOk(ctx, await this.model.getAll())
  }
}
