import Route, { Access } from './Route'
import { Types } from '../utils/types'
import { month } from '../utils/date'
import { preformatHumanResources } from '../utils/ventilator'
import { getHumanRessourceList } from '../utils/humanServices'
import { sumBy } from 'lodash'

/**
 * Route des calculs de la page calcule
 */

export default class RouteCalculator extends Route {
  /**
   * Constructeur
   * @param {*} params
   */
  constructor (params) {
    super({ ...params, model: 'HumanResources' })
  }

  /**
   * Interface des retours de calcul de la page calculateur
   * @param {*} backupId
   * @param {*} dateStart
   * @param {*} dateStop
   * @param {*} contentieuxIds
   * @param {*} optionBackupId
   * @param {*} categorySelected
   * @param {*} selectedFonctionsIds
   */
  @Route.Post({
    bodyType: Types.object().keys({
      backupId: Types.number().required(),
      dateStart: Types.date().required(),
      dateStop: Types.date().required(),
      contentieuxIds: Types.array().required(),
      optionBackupId: Types.number(),
      categorySelected: Types.string().required(),
      selectedFonctionsIds: Types.array(),
      loadChildrens: Types.boolean(),
    }),
    accesses: [Access.canVewCalculator],
  })
  async filterList (ctx) {
    const { backupId } = this.body(ctx)

    if (!(await this.models.HRBackups.haveAccess(backupId, ctx.state.user.id))) {
      ctx.throw(401, "Vous n'avez pas accès à cette juridiction !")
    }

    this.sendOk(ctx, await this.model.onCalculate(this.body(ctx), ctx.state.user))
  }

  /**
   * Interface des retours de calcul de la page calculateur
   * @param {*} backupId
   * @param {*} dateStart
   * @param {*} dateStop
   * @param {*} contentieuxIds
   * @param {*} optionBackupId
   * @param {*} categorySelected
   * @param {*} selectedFonctionsIds
   */
  @Route.Post({
    bodyType: Types.object().keys({
      backupId: Types.number().required(),
      dateStart: Types.date().required(),
      dateStop: Types.date().required(),
      contentieuxId: Types.number().required(),
      type: Types.string().required(),
    }),
    accesses: [Access.canVewCalculator],
  })
  async rangeValues (ctx) {
    let { backupId, dateStart, dateStop, contentieuxId, type } = this.body(ctx)
    dateStart = month(dateStart)
    dateStop = month(dateStop)
    const hrList = await this.model.getCache(backupId)

    const list = []

    do {
      switch (type) {
      case 'entrees':
        {
          const activites = await this.models.Activities.getByMonth(dateStart, backupId, contentieuxId, false)
          if (activites.length) {
            const acti = activites[0]
            if (acti.entrees !== null) {
              list.push(acti.entrees)
            } else if (acti.originalEntrees !== null) {
              list.push(acti.originalEntrees)
            } else {
              list.push(null)
            }
          }
        }
        break
      case 'sorties':
        {
          const activites = await this.models.Activities.getByMonth(dateStart, backupId, contentieuxId, false)
          if (activites.length) {
            const acti = activites[0]
            if (acti.sorties !== null) {
              list.push(acti.sorties)
            } else if (acti.ori !== null) {
              list.push(acti.originalSorties)
            } else {
              list.push(null)
            }
          }
        }
        break
      case 'stock':
        {
          const activites = await this.models.Activities.getByMonth(dateStart, backupId, contentieuxId, false)
          if (activites.length) {
            const acti = activites[0]
            if (acti.stock !== null) {
              list.push(acti.stock)
            } else if (acti.originalStock !== null) {
              list.push(acti.originalStock)
            } else {
              list.push(null)
            }
          }
        }
        break
      case 'ETPTEam':
      case 'ETPTGreffe':
      case 'ETPTSiege':
        {
          const catId = type === 'ETPTSiege' ? 1 : type === 'ETPTGreffe' ? 2 : 3
          const preformatedAllHumanResource = preformatHumanResources(hrList, dateStart)
          let hList = await getHumanRessourceList(preformatedAllHumanResource, [contentieuxId], [catId], dateStart)
          let totalAffected = 0
          hList.map((agent) => {
            const activities = (agent.currentActivities || []).filter((r) => r.contentieux && r.contentieux.id === contentieuxId)
            const timeAffected = sumBy(activities, 'percent')
            if (timeAffected) {
              let realETP = (agent.etp || 0) - agent.hasIndisponibility
              if (realETP < 0) {
                realETP = 0
              }
              totalAffected += (timeAffected / 100) * realETP
            }
          })
          console.log(dateStart, hList.length, totalAffected)
          list.push(totalAffected)
        }
        break
      default:
        {
          console.log('type', type)
        }
        break
      }
      //console.log(dateStart)

      dateStart.setMonth(dateStart.getMonth() + 1)
    } while (dateStart.getTime() <= dateStop.getTime())

    this.sendOk(ctx, list)
  }
}
