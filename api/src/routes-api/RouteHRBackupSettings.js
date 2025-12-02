import Route, { Access } from './Route'
import { Types } from '../utils/types'

/**
 * Route des options d'une juridiction
 */

export default class RouteHrBackupSettings extends Route {
  // model de BDD
  model

  /**
   * Constructeur
   * @param {*} params
   */
  constructor(params) {
    super(params)

    this.model = params.models.HRBackupsSettings
  }

  /**
   * List des options
   * @param {*} backupId
   * @param {*} types
   */
  @Route.Post({
    bodyType: Types.object().keys({
      backupId: Types.number().required(),
      types: Types.array(),
    }),
    accesses: [Access.isLogin],
  })
  async list(ctx) {
    const { backupId, types } = this.body(ctx)

    if (!(await this.models.HRBackups.haveAccess(backupId, ctx.state.user.id))) {
      ctx.throw(401, "Vous n'avez pas accès à cette juridiction !")
    }

    this.sendOk(ctx, await this.model.list(backupId, types, ctx.state.user.id))
  }

  /**
   * Interface de création ou de mise à jour d'un paramètre
   * @param {*} id
   * @param {*} backupId
   * @param {*} type
   * @param {*} datas
   */
  @Route.Post({
    bodyType: Types.object().keys({
      id: Types.number(),
      backupId: Types.number().required(),
      label: Types.string().required(),
      type: Types.string().required(),
      datas: Types.any().required(),
    }),
    accesses: [Access.isLogin],
  })
  async addOrUpdate(ctx) {
    const { backupId, id, label, type, datas } = this.body(ctx)

    if (!(await this.models.HRBackups.haveAccess(backupId, ctx.state.user.id))) {
      ctx.throw(401, "Vous n'avez pas accès à cette juridiction !")
    }

    await this.model.addOrUpdate(id, backupId, label, type, datas)

    this.sendOk(ctx, 'Ok')
  }

  /**
   * Interface de création ou de mise à jour d'un paramètre
   * @param {*} id
   * @param {*} backupId
   * @param {*} type
   * @param {*} datas
   */
  @Route.Delete({
    path: 'remove-setting/:id',
    accesses: [Access.isLogin],
  })
  async removeSetting(ctx) {
    const { id } = ctx.params

    try {
      await this.model.removeSetting(id, ctx.state.user.id)
      this.sendOk(ctx, 'Ok')
    } catch (err) {
      ctx.throw(401, err)
    }
  }
}
