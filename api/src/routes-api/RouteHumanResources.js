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
    accesses: [Access.canVewHR],
  })
  async getCurrentHr (ctx) {
    let { backupId } = this.body(ctx)
    const backups = await this.model.models.HRBackups.list(ctx.state.user.id)
    backupId = backupId || (backups.length ? backups[backups.length - 1].id : null)

    this.sendOk(ctx, {
      hr: await this.model.getCurrentHr(backupId),
      backups,
      backupId,
      categories: await this.model.models.HRCategories.getAll(),
      fonctions: await this.model.models.HRFonctions.getAll(),
    })
  }

  @Route.Delete({
    path: 'remove-backup/:backupId',
    accesses: [Access.canVewHR],
  })
  async removeBackup (ctx) {
    const { backupId } = ctx.params   

    await this.model.models.HRBackups.removeBackup(backupId)

    this.sendOk(ctx, 'OK')
  }

  @Route.Post({
    bodyType: Types.object().keys({
      backupId: Types.number().required(),
      backupName: Types.string().required(),
    }),
    accesses: [Access.canVewHR],
  })
  async duplicateBackup (ctx) {
    const { backupId, backupName } = this.body(ctx)

    this.sendOk(ctx, await this.model.models.HRBackups.duplicateBackup(backupId, backupName))
  }

  @Route.Post({
    bodyType: Types.object().keys({
      hrList: Types.any(),
      backupId: Types.number(),
      backupName: Types.string(),
    }),
    accesses: [Access.canVewHR],
  })
  async saveBackup (ctx) {
    const { backupId, hrList, backupName } = this.body(ctx)

    const newId = await this.model.models.HRBackups.saveBackup(hrList, backupId, backupName)

    this.sendOk(ctx, newId)
  }
}
