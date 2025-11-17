import Route, { Access } from './Route'
import { Types } from '../utils/types'

/**
 * Route des temps moyens par dossier
 */

export default class RouteContentieuxOptions extends Route {
  // model de BDD
  model

  /**
   * Constructeur
   * @param {*} params
   */
  constructor(params) {
    super(params)

    this.model = params.models.ContentieuxOptions
  }

  /**
   * Interface de la liste des sauvegardes des temps moyens
   * @param {*} backupId
   * @param {*} juridictionId
   */
  @Route.Post({
    bodyType: Types.object().keys({
      backupId: Types.number(),
      juridictionId: Types.number().required(),
    }),
    accesses: [Access.canVewContentieuxOptions],
  })
  async getAll(ctx) {
    let { juridictionId, backupId } = this.body(ctx)
    const backups = await this.model.models.OptionsBackups.getBackup(ctx.state.user.id, juridictionId)
    backupId = backups.find((b) => b.id === backupId) ? backupId : backups.length ? backups[backups.length - 1].id : null

    this.sendOk(ctx, {
      backups,
      backupId,
    })
  }

  /**
   * Interface pour supprimer une sauvegarde
   */
  @Route.Delete({
    path: 'remove-backup/:backupId',
    accesses: [Access.canEditContentieuxOptions],
  })
  async removeBackup(ctx) {
    const { backupId } = ctx.params

    await this.model.models.OptionsBackups.removeBackup(backupId)

    this.sendOk(ctx, 'OK')
  }

  /**
   * Interface pour duppliquer une sauvegarde limité à la juridiction
   * @param {*} backupId
   * @param {*} backupName
   * @param {*} juridictionId
   */
  @Route.Post({
    bodyType: Types.object().keys({
      backupId: Types.number().required(),
      backupName: Types.string().required(),
      juridictionId: Types.number().required(),
      backupStatus: Types.string().required(),
      type: Types.string().required(),
    }),
    accesses: [Access.canEditContentieuxOptions],
  })
  async duplicateBackup(ctx) {
    const { backupId, backupName, backupStatus, type, juridictionId } = this.body(ctx)

    if (await this.models.OptionsBackups.haveAccess(backupId, juridictionId, ctx.state.user.id)) {
      this.sendOk(ctx, await this.model.models.OptionsBackups.duplicateBackup(ctx.state.user.id, backupId, backupName, juridictionId, backupStatus, type))
    } else {
      this.sendOk(ctx, null)
    }
  }

  /**
   * Interface pour modifier les temps moyens d'une sauvegarde
   * @param {*} list
   * @param {*} backupId
   * @param {*} backupName
   * @param {*} juridictionId
   */
  @Route.Post({
    bodyType: Types.object().keys({
      list: Types.any(),
      backupId: Types.number(),
      backupName: Types.string(),
      juridictionId: Types.number().required(),
      backupStatus: Types.string(),
      type: Types.string().required(),
    }),
    accesses: [Access.canEditContentieuxOptions],
  })
  async saveBackup(ctx) {
    const { backupId, list, backupName, juridictionId, backupStatus, type } = this.body(ctx)
    if (
      (backupId && (await this.models.OptionsBackups.haveAccess(backupId, juridictionId, ctx.state.user.id))) ||
      (!backupId && (await this.models.HRBackups.haveAccess(juridictionId, ctx.state.user.id)))
    ) {
      const newId = await this.model.models.OptionsBackups.saveBackup(ctx.state.user.id, list, backupId, backupName, juridictionId, backupStatus, type)

      if (newId !== null) await this.model.models.HistoriesContentieuxUpdate.addHistory(ctx.state.user.id, newId)

      this.sendOk(ctx, newId)
    } else {
      this.sendOk(ctx, null)
    }
  }

  /**
   * Interface de modification d'une sauvegarde
   * @param {*} backupId
   * @param {*} backupName
   * @param {*} juridictionId
   */
  @Route.Post({
    bodyType: Types.object().keys({
      backupId: Types.number().required(),
      backupName: Types.string().required(),
      juridictionId: Types.number().required(),
    }),
    accesses: [Access.canEditContentieuxOptions],
  })
  async renameBackup(ctx) {
    const { backupId, backupName, juridictionId } = this.body(ctx)

    if (await this.models.OptionsBackups.haveAccess(backupId, juridictionId, ctx.state.user.id)) {
      await this.model.models.OptionsBackups.renameBackup(backupId, backupName)

      this.sendOk(ctx, 'Ok')
    } else {
      this.sendOk(ctx, null)
    }
  }

  /**
   * Interface de la liste des toutes les sauvegardes
   */
  @Route.Get({
    accesses: [Access.isAdmin],
  })
  async getAllAdmin(ctx) {
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

  /**
   * Interface pour modifier les accès à une juridiction
   * @param {*} ctx
   * @param {*} ctx
   */
  @Route.Post({
    bodyType: Types.object().keys({
      id: Types.number().required(),
      juridictions: Types.array().required(),
    }),
    accesses: [Access.isAdmin],
  })
  async updateBackup(ctx) {
    const { id, juridictions } = this.body(ctx)

    await this.model.models.OptionsBackupJuridictions.changeRules(id, juridictions)

    this.sendOk(ctx, 'Ok')
  }

  /**
   * Liste des temps moyen d'une sauvegarde
   */
  @Route.Get({
    path: 'get-backup-details/:backupId',
    accesses: [Access.canVewContentieuxOptions],
  })
  async getBackupDetails(ctx) {
    const { backupId } = ctx.params

    if (await this.models.OptionsBackups.haveAccessWithoutJuridiction(backupId, ctx.state.user.id)) {
      this.sendOk(ctx, await this.model.getAllById(backupId))
    } else {
      this.sendOk(ctx, null)
    }
  }

  /**
   * Interface de dernière date de mise à jour d'une sauvegarde
   * @param {*} backupId
   * @param {*} juridictionId
   */
  @Route.Post({
    bodyType: Types.object().keys({
      backupId: Types.number(),
      juridictionId: Types.number().required(),
    }),
    accesses: [Access.canVewContentieuxOptions],
  })
  async getLastUpdate(ctx) {
    const { backupId, juridictionId } = this.body(ctx)

    if (await this.models.OptionsBackups.haveAccess(backupId, juridictionId, ctx.state.user.id)) {
      const result = await this.model.models.HistoriesContentieuxUpdate.getLastUpdate(backupId)

      this.sendOk(ctx, result)
    } else {
      this.sendOk(ctx, null)
    }
  }
}
