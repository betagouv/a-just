import Route, { Access } from './Route'
import { Types } from '../utils/types'
import { ADMIN_REMOVE_HR } from '../constants/log-codes'

export default class RouteHumanResources extends Route {
  constructor (params) {
    super({ ...params, model: 'HumanResources' })
  }

  @Route.Post({
    bodyType: Types.object().keys({
      backupId: Types.any(),
    }),
    accesses: [Access.canVewHR],
  })
  async getCurrentHr (ctx) {
    let { backupId } = this.body(ctx)
    const backups = await this.model.models.HRBackups.list(ctx.state.user.id)
    backupId = backupId || (backups.length ? backups[backups.length - 1].id : null)
    const activities = await this.model.models.Activities.getAll(backupId)

    this.sendOk(ctx, {
      hr: await this.model.getCurrentHr(backupId),
      backups,
      backupId,
      categories: await this.model.models.HRCategories.getAll(),
      fonctions: await this.model.models.HRFonctions.getAll(),
      activities,
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

  @Route.Get({
    accesses: [Access.isAdmin],
  })
  async getBackupList (ctx) {
    this.sendOk(ctx, await this.model.models.HRBackups.getAll())
  }

  @Route.Post({
    bodyType: Types.object().keys({
      backupId: Types.number(),
      hr: Types.any(),
    }),
    accesses: [Access.canVewHR],
  })
  async updateHr (ctx) {
    let { backupId, hr } = this.body(ctx)

    this.sendOk(ctx, await this.model.updateHR(hr, backupId))
  }

  @Route.Delete({
    path: 'remove-hr/:hrId',
    accesses: [Access.isAdmin],
  })
  async removeHR (ctx) {
    const { hrId } = ctx.params   

    if(await this.models.HumanResources.haveAccess(hrId, ctx.state.user.id)) {
      await this.models.Logs.addLog(ADMIN_REMOVE_HR, ctx.state.user.id, { hrId })
      this.sendOk(ctx, await this.model.removeHR(hrId))
    } else {
      this.sendOk(ctx, null)
    }
  }

  @Route.Delete({
    path: 'remove-situation/:situationId',
    accesses: [Access.canVewHR],
  })
  async removeSituation (ctx) {
    const { situationId } = ctx.params   
    const hrId = await this.models.HRSituations.haveHRId(situationId, ctx.state.user.id)
    if(hrId) {
      if(await this.models.HRSituations.destroyById(situationId)) {
        this.sendOk(ctx, await this.model.getHr(hrId))
      }
    }
    
    this.sendOk(ctx, null)
  }
}
