import Route from './Route'

/**
 * Route lié au SSO
 */
export default class RouteSSO extends Route {
  /**
   * Constructeur
   * @param {*} params
   */
  constructor (params) {
    super({ ...params, model: 'Users' })
  }

  /**
   * Test de voir si on a accès au SSO
   */
  @Route.Get()
  async isReady (ctx) {
    this.sendOk(ctx, { success: false, url: '' })
  }
}
