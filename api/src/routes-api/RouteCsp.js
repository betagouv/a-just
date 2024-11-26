import Route from './Route'
import { Types } from '../utils/types'

/**
 * Route des imports
 */
export default class RouteCsp extends Route {
  // model de BDD
  model

  /**
   * Constructeur
   * @param {*} params
   */
  constructor (params) {
    super(params)

    this.model = params.models.HumanResources
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
