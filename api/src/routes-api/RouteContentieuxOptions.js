import Route, { Access } from './Route'
import { Types } from '../utils/types'

export default class RouteContentieuxOptions extends Route {
  constructor (params) {
    super({ ...params, model: 'ContentieuxOptions' })
  }

  @Route.Post({
    bodyType: Types.object().keys({
      backupId: Types.number(),
      juridictionId: Types.number().required(),
    }),
    accesses: [Access.canVewContentieuxOptions],
  })
  async getAll (ctx) {
    let { juridictionId, backupId } = this.body(ctx)
    const backups = await this.model.models.OptionsBackups.getBackup(
      ctx.state.user.id,
      juridictionId
    )
    backupId =
      backupId || (backups.length ? backups[backups.length - 1].id : null)

    this.sendOk(ctx, {
      backups,
      backupId,
    })
  }

  @Route.Delete({
    path: 'remove-backup/:backupId',
    accesses: [Access.canVewContentieuxOptions],
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
      juridictionId: Types.number().required(),
    }),
    accesses: [Access.canVewContentieuxOptions],
  })
  async duplicateBackup (ctx) {
    const { backupId, backupName, juridictionId } = this.body(ctx)

    if (
      await this.models.OptionsBackups.haveAccess(
        backupId,
        juridictionId,
        ctx.state.user.id
      )
    ) {
      this.sendOk(
        ctx,
        await this.model.models.OptionsBackups.duplicateBackup(
          backupId,
          backupName,
          juridictionId
        )
      )
    } else {
      this.sendOk(ctx, null)
    }
  }

  @Route.Post({
    bodyType: Types.object().keys({
      list: Types.any(),
      backupId: Types.number(),
      backupName: Types.string(),
      juridictionId: Types.number().required(),
    }),
    accesses: [Access.canVewContentieuxOptions],
  })
  async saveBackup (ctx) {
    const { backupId, list, backupName, juridictionId } = this.body(ctx)

    if (
      (backupId &&
        (await this.models.OptionsBackups.haveAccess(
          backupId,
          juridictionId,
          ctx.state.user.id
        ))) ||
      (!backupId &&
        (await this.models.HRBackups.haveAccess(
          juridictionId,
          ctx.state.user.id
        )))
    ) {
      const newId = await this.model.models.OptionsBackups.saveBackup(
        list,
        backupId,
        backupName,
        juridictionId
      )

      this.sendOk(ctx, newId)
    } else {
      this.sendOk(ctx, null)
    }
  }

  @Route.Post({
    bodyType: Types.object().keys({
      backupId: Types.number().required(),
      backupName: Types.string().required(),
      juridictionId: Types.number().required(),
    }),
    accesses: [Access.canVewContentieuxOptions],
  })
  async renameBackup (ctx) {
    const { backupId, backupName, juridictionId } = this.body(ctx)

    if (
      await this.models.OptionsBackups.haveAccess(
        backupId,
        juridictionId,
        ctx.state.user.id
      )
    ) {
      await this.model.models.OptionsBackups.renameBackup(backupId, backupName)

      this.sendOk(ctx, 'Ok')
    } else {
      this.sendOk(ctx, null)
    }
  }

  @Route.Get({
    accesses: [Access.isAdmin],
  })
  async getAllAdmin (ctx) {
    const list = await this.models.OptionsBackups.adminGetAll()

    const juridictions = await this.models.HRBackups.findAll({
      attributes: ['id', 'label'],
      raw: true,
    })

    this.sendOk(ctx, {
      list,
      juridictions,
    })
  }

  @Route.Post({
    bodyType: Types.object().keys({
      id: Types.number().required(),
      juridictions: Types.array().required(),
    }),
    accesses: [Access.isAdmin],
  })
  async updateBackup (ctx) {
    const { id, juridictions } = this.body(ctx)

    await this.model.models.OptionsBackupJuridictions.changeRules(
      id,
      juridictions
    )

    this.sendOk(ctx, 'Ok')
  }

  @Route.Get({
    path: 'get-backup-details/:backupId',
    accesses: [Access.canVewContentieuxOptions],
  })
  async getBackupDetails (ctx) {
    const { backupId } = ctx.params

    if (
      await this.models.OptionsBackups.haveAccessWithoutJuridiction(
        backupId,
        ctx.state.user.id
      )
    ) {
      this.sendOk(ctx, await this.model.getAllById(backupId))
    } else {
      this.sendOk(ctx, null)
    }
  }
}
