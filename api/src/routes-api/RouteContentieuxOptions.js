import Route, { Access } from './Route'
import { Types } from '../utils/types'

export default class RouteContentieuxOptions extends Route {
  constructor (params) {
    super({ ...params, model: 'ContentieuxOptions' })
  }

  @Route.Post({
    bodyType: Types.object().keys({
      backupId: Types.number(),
    }),
    accesses: [Access.isLogin],
  })
  async getAll (ctx) {
    let { backupId } = this.body(ctx)
    const backups = await this.model.models.OptionsBackups.getBackup(ctx.state.user.id)
    backupId = backupId || backups.length ? backups[backups.length - 1].id : null
    const list = await this.model.getAll(backupId)

    this.sendOk(ctx, {
      list,
      backups,
      backupId,
    })
  }

  @Route.Delete({
    path: 'remove-backup/:backupId',
    accesses: [Access.isLogin],
  })
  async removeBackup (ctx) {
    const { backupId } = ctx.params   

    await this.model.models.OptionsBackups.removeBackup(backupId)

    this.sendOk(ctx, 'OK')
  }

  @Route.Post({
    bodyType: Types.object().keys({
      backupId: Types.number().required(),
      backupName: Types.string().required(),
    }),
    accesses: [Access.isLogin],
  })
  async duplicateBackup (ctx) {
    const { backupId, backupName } = this.body(ctx)

    this.sendOk(ctx, await this.model.models.OptionsBackups.duplicateBackup(backupId, backupName))
  }

  @Route.Post({
    bodyType: Types.object().keys({
      list: Types.any(),
      backupId: Types.number(),
      backupName: Types.string(),
    }),
    accesses: [Access.isLogin],
  })
  async saveBackup (ctx) {
    const { backupId, list, backupName } = this.body(ctx)

    const newId = await this.model.models.OptionsBackups.saveBackup(list, backupId, backupName)

    this.sendOk(ctx, newId)
  }
}
