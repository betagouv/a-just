import Route, { Access } from './Route'
import { Types } from '../utils/types'
import { isCa } from '../utils/ca'

/**
 * Route des juridictions
 */
export default class RouteJuridictions extends Route {
  // model de BDD
  model

  /**
   * Constructeur
   * @param {*} params
   */
  constructor(params) {
    super(params)

    this.model = params.models.TJ
  }

  /**
   * Interface qui retourne toutes les juridictions
   */
  @Route.Get()
  async getAllVisibles(ctx) {
    let list = null
    if (isCa()) list = await this.model.getAllWithUser()
    else list = await this.model.getAllVisibles()
    this.sendOk(ctx, list)
  }

  /**
   * Interface qui retourne toutes les juridictions
   */
  @Route.Get({
    accesses: [Access.isAdmin],
  })
  async getAll(ctx) {
    const list = await this.model.getAll()
    this.sendOk(ctx, list)
  }

  /**
   * Interface qui retourne toutes les HR Backups
   */
  @Route.Get({
    accesses: [Access.isAdmin],
  })
  async getAllBackup(ctx) {
    const list = await this.model.models.HRBackups.getAll()
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
  async updateJuridiction(ctx) {
    const { node, value, juridictionId } = this.body(ctx)

    await this.model.updateJuridiction(juridictionId, node, value)

    this.sendOk(ctx, 'Ok')
  }

  /**
   * Obtenir la liste de tout les TGI et TPRX avec leurs IELST
   */
  @Route.Get()
  async getAllIelst(ctx) {
    const list = await this.model.getAllIelst()
    this.sendOk(ctx, list)
  }

  /**
   * Interface de résultat de simulation de la page de simulation
   * @param {*} backupId
   * @param {*} params
   * @param {*} simulation
   * @param {*} dateStart
   * @param {*} dateStop
   * @param {*} selectedCategoryId
   */
  @Route.Post({
    bodyType: Types.object().keys({
      juridictionName: Types.string().required(),
      backupId: Types.number().required(),
      copyAct: Types.boolean().required(),
      statExclusion: Types.boolean().required(),
    }),
    accesses: [Access.isAdmin],
  })
  async duplicateJuridiction(ctx) {
    const { juridictionName, backupId, copyAct, statExclusion } = this.body(ctx)

    await models.HRBackups.duplicateBackup(backupId, juridictionName, copyAct, statExclusion)

    this.sendOk(ctx, 'En cours')
  }
}
