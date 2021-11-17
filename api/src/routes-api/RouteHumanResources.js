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
    const backups = await this.model.models.HRBackups.list(ctx.state.user.id)

    console.log(backups)

    this.sendOk(ctx, {
      hr: await this.model.getCurrentHr(backupId),
      backups,
      backupId: backupId || backups[backups.length - 1].id,
      categories: await this.model.models.HRCategories.getAll(),
      fonctions: await this.model.models.HRFonctions.getAll(),
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
      backupId: Types.number().required(),
      backupName: Types.string().required(),
    }),
    accesses: [Access.isLogin],
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
    accesses: [Access.isLogin],
  })
  async saveBackup (ctx) {
    const { backupId, hrList, backupName } = this.body(ctx)

    const newId = await this.model.models.HRBackups.saveBackup(hrList, backupId, backupName)

    this.sendOk(ctx, newId)
  }
}
