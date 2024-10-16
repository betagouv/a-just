import Route, { Access } from './Route'
import { Types } from '../utils/types'
import { today } from '../utils/date'
import { ACTIVITIES_CHANGE_DATE, ACTIVITIES_PAGE_LOAD } from '../constants/log-codes'

/**
 * Route contenant les lectures et modifications des activités
 */
export default class RouteActivities extends Route {
  /**
   * Constructeur
   * @param {*} params
   */
  constructor (params) {
    super({ ...params, model: 'Activities' })

    // this.cleanDatas() TO TEST
  }

  /**
   * Fonction de dev pour forcer de supprimer les doublons d'activités
   */
  async cleanDatas () {
    const backups = await this.models.HRBackups.getAll()

    for (let i = 0; i < backups.length; i++) {
      await this.models.Activities.removeDuplicateDatas(backups[i].id)
      await this.models.Activities.cleanActivities(backups[i].id)
    }
  }

  /**
   * Modification des entrees / sorties / stock d'un contentieux à un mois donné
   * @param {*} contentieuxId
   * @param {*} date
   * @param {*} values
   * @param {*} hrBackupId
   * @param {*} nodeUpdated
   */
  @Route.Post({
    bodyType: Types.object().keys({
      contentieuxId: Types.number(),
      date: Types.date(),
      values: Types.any(),
      hrBackupId: Types.number(),
      nodeUpdated: Types.string(),
    }),
    accesses: [Access.canVewActivities],
  })
  async updateBy (ctx) {
    const { contentieuxId, date, values, hrBackupId, nodeUpdated } = this.body(ctx)
    await this.model.updateBy(contentieuxId, date, values, hrBackupId, ctx.state.user.id, nodeUpdated)
    this.sendOk(ctx, 'Ok')
  }

  /**
   * API retour de la liste des activités des contentieux d'un mois et d'une juridiction
   * @param {*} date
   * @param {*} hrBackupId
   */
  @Route.Post({
    bodyType: Types.object().keys({
      date: Types.date(),
      hrBackupId: Types.number(),
    }),
    accesses: [Access.canVewActivities],
  })
  async getByMonth (ctx) {
    const { date, hrBackupId } = this.body(ctx)

    if (await this.models.HRBackups.haveAccess(hrBackupId, ctx.state.user.id) || Access.isAdmin(ctx)) {

      const dateLastMonth = await this.model.getLastMonth(hrBackupId)
      this.models.Logs.addLog(today(dateLastMonth).getTime() === today(date).getTime() ? ACTIVITIES_PAGE_LOAD : ACTIVITIES_CHANGE_DATE, ctx.state.user.id)


      const list = await this.model.getByMonth(date, hrBackupId)
      this.sendOk(ctx, {
        list,
        lastUpdate: await this.models.HistoriesActivitiesUpdate.getLastUpdate(list.map((i) => i.id)),
      })
    } else {
      this.sendOk(ctx, null)
    }
  }

  /**
   * API dernier mois où il y a des données d'une juridiction
   * @param {*} hrBackupId
   */
  @Route.Post({
    bodyType: Types.object().keys({
      hrBackupId: Types.number(),
    }),
    accesses: [Access.isLogin],
  })
  async getLastMonth (ctx) {
    const { hrBackupId } = this.body(ctx)
    if ((await this.models.HRBackups.haveAccess(hrBackupId, ctx.state.user.id)) || Access.isAdmin(ctx)) {
      const date = await this.model.getLastMonth(hrBackupId)
      this.sendOk(ctx, {
        date,
      })
    } else {
      this.sendOk(ctx, null)
    }
  }

  /**
   * API dernier mois où il y a des données d'une juridiction
   * @param {*} hrBackupId
   */
  @Route.Post({
    bodyType: Types.object().keys({
      hrBackupId: Types.number(),
    }),
    accesses: [Access.isLogin],
  })
  async getLastHumanActivities (ctx) {
    const { hrBackupId } = this.body(ctx)
    if (await this.models.HRBackups.haveAccess(hrBackupId, ctx.state.user.id)) {
      const list = await this.models.HistoriesActivitiesUpdate.getLasHumanActivites(hrBackupId)
      this.sendOk(ctx, {
        list,
      })
    } else {
      this.sendOk(ctx, null)
    }
  }

  /**
   * API dernier mois où il y a des données d'une juridiction
   * @param {*} hrBackupId
   */
  @Route.Post({
    bodyType: Types.object().keys({
      hrBackupId: Types.number(),
      dateStart: Types.date(),
      dateEnd: Types.date(),
    }),
    accesses: [Access.isLogin],
  })
  async getNotCompleteActivities (ctx) {
    const { hrBackupId, dateStart, dateEnd } = this.body(ctx)
    if (await this.models.HRBackups.haveAccess(hrBackupId, ctx.state.user.id)) {
      const list = await this.model.getNotCompleteActivities(hrBackupId, dateStart, dateEnd)
      this.sendOk(ctx, {
        list,
      })
    } else {
      this.sendOk(ctx, null)
    }
  }
}
