import Route, { Access } from './Route'
import { Types } from '../utils/types'

export default class RouteHumanResources extends Route {
  constructor (params) {
    super({ ...params, model: 'HumanResources' })
  }

  @Route.Post({
    bodyType: Types.object().keys({
      backupId: Types.number(),
    }),
    accesses: [Access.isLogin],
  })
  async getCurrentHr (ctx) {
    const { backupId } = this.body(ctx)

    this.sendOk(ctx, {
      hr: await this.model.getCurrentHr(backupId),
      contentieuxReferentiel: await this.model.models.ContentieuxReferentiels.getMainTitles(),
      backups: await this.model.models.HRBackups.list(),
      backupId: backupId || await this.model.models.HRBackups.lastId(),
    })
  }

  @Route.Delete({
    path: 'remove-backup/:backupId',
    accesses: [Access.isLogin],
  })
  async removeBackup (ctx) {
    const { backupId } = ctx.params   

    await this.model.models.HRBackups.removeBackup(backupId)

    this.sendOk(ctx, 'OK')
  }

  @Route.Post({
    bodyType: Types.object().keys({
      backupId: Types.number(),
    }),
    accesses: [Access.isLogin],
  })
  async duplicateBackup (ctx) {
    const { backupId } = this.body(ctx)

    this.sendOk(ctx, await this.model.models.HRBackups.duplicateBackup(backupId))
  }
}
