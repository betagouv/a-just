import Route from './Route'
import { Types } from '../utils/types'

/**
 * Route des imports
 */
export default class RouteCsp extends Route {
  /**
   * Constructeur
   * @param {*} params
   */
  constructor (params) {
    super({ ...params, model: 'HumanResources' })
  }

  /**
   * Interface qui permet d'importer une liste de fiche
   * @param {*} file
   */
  @Route.Post({
    bodyType: Types.object().keys({
      ['csp-report']: Types.any(),
    }),
  })
  async report (ctx) {
    console.log(this.body(ctx))
    this.sendOk(ctx, 'OK')
  }
}
