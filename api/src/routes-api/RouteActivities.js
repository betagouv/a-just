import Route, { Access } from './Route'
import { Types } from '../utils/types'

export default class RouteActivities extends Route {
  constructor (params) {
    super({ ...params, model: 'Activities' })
  }

  @Route.Post({
    bodyType: Types.object().keys({
      backupId: Types.number(),
    }),
    accesses: [Access.canVewActivities],
  })
  async getAll (ctx) {
    let { backupId } = this.body(ctx)
    const backups = await this.model.models.ActivitiesBackups.getBackup(ctx.state.user.id)
    backupId = backupId || backups.length ? backups[backups.length - 1].id : null
    const list = await this.model.getAll(backupId)

    this.sendOk(ctx, {
      activities: list,
      backups,
      backupId,
    })
  }

  @Route.Delete({
    path: 'remove-backup/:backupId',
    accesses: [Access.canVewActivities],
  })
  async removeBackup (ctx) {
    const { backupId } = ctx.params   

    await this.model.models.ActivitiesBackups.removeBackup(backupId)

    this.sendOk(ctx, 'OK')
  }

  @Route.Post({
    bodyType: Types.object().keys({
      backupId: Types.number().required(),
      backupName: Types.string().required(),
    }),
    accesses: [Access.canVewActivities],
  })
  async duplicateBackup (ctx) {
    const { backupId, backupName } = this.body(ctx)

    this.sendOk(ctx, await this.model.models.ActivitiesBackups.duplicateBackup(backupId, backupName))
  }

  @Route.Post({
    bodyType: Types.object().keys({
      list: Types.any(),
      backupId: Types.number(),
      backupName: Types.string(),
    }),
    accesses: [Access.canVewActivities],
  })
  async saveBackup (ctx) {
    const { backupId, list, backupName } = this.body(ctx)

    const newId = await this.model.models.ActivitiesBackups.saveBackup(list, backupId, backupName)

    this.sendOk(ctx, newId)
  }

  @Route.Get({
    accesses: [Access.isAdmin],
  })
  async getBackupList (ctx) {
    this.sendOk(ctx, await this.model.models.ActivitiesBackups.getAll())
  }
}
