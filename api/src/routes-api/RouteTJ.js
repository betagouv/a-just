import Route, { Access } from './Route'
import { Types } from '../utils/types'

/**
 * Route des juridictions
 */
export default class RouteJuridictions extends Route {
  /**
   * Constructeur
   * @param {*} params
   */
  constructor (params) {
    super({ ...params, model: 'TJ' })
  }

  /**
   * Interface qui retourne toutes les juridictions
   */
  @Route.Get()
  async getAllVisibles (ctx) {
    const list = await this.model.getAllVisibles()
    this.sendOk(ctx, list)
  }

  /**
   * Interface qui retourne toutes les juridictions
   */
  @Route.Get({
    accesses: [Access.isAdmin],
  })
  async getAll (ctx) {
    const list = await this.model.getAll()
    this.sendOk(ctx, list)
  }

  /**
   * Modification d'une juridiction
   * @param {*} node
   * @param {*} juridictionId
   */
  @Route.Put({
    bodyType: Types.object().keys({
      node: Types.string().required(),
      value: Types.any().required(),
      juridictionId: Types.number().required(),
    }),
    accesses: [Access.isAdmin],
  })
  async updateJuridiction (ctx) {
    const { node, value, juridictionId } = this.body(ctx)

    await this.model.updateJuridiction(juridictionId, {
      [node]: value || null,
    })

    this.sendOk(ctx, 'Ok')
  }

  /**
   * Obtenir la liste de tout les TGI et TPRX avec leurs IELST
   */
  @Route.Get()
  async getAllIelst (ctx) {
    const list = await this.model.getAllIelst()
    this.sendOk(ctx, list)
  }
}
