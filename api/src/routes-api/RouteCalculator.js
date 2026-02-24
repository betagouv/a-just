import Route, { Access } from './Route'
import { Types } from '../utils/types'
import { getNbMonth, month, today } from '../utils/date'
import { loadOrWarmHR } from '../utils/redis'
import { fixDecimal } from '../utils/number'
import { calculateETPForContentieux, generateHRIndexes } from '../utils/human-resource'
import { getEtpByCategory } from '../utils/simulator'

/**
 * Route des calculs de la page calcule
 */

export default class RouteCalculator extends Route {
  // model de BDD
  model

  /**
   * Constructeur
   * @param {*} params
   */
  constructor(params) {
    super(params)

    this.model = params.models.HumanResources
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
  async filterList(ctx) {
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
      backupId: Types.number(),
      dateStart: Types.date(),
      dateStop: Types.date(),
      contentieuxId: Types.number(),
      type: Types.string(),
      fonctionsIds: Types.array(),
      categorySelected: Types.string(),
    }),
    accesses: [Access.canVewCalculator],
  })
  async rangeValues(ctx) {
    let { backupId, dateStart, dateStop, contentieuxId, type, fonctionsIds, categorySelected } = this.body(ctx)

    dateStart = today(dateStart)
    dateStop = today(dateStop)
    let hrList = null
    let indexes = null
    if (['ETPTEam', 'ETPTGreffe', 'ETPTSiege', 'etpt'].includes(type)) {
      if (type === 'etpt' && categorySelected) {
        type = categorySelected === 'magistrats' ? 'ETPTSiege' : (categorySelected === 'fonctionnaires' ? 'ETPTGreffe' : 'ETPTEam')
      }
    }

    hrList = await loadOrWarmHR(backupId, this.models, ctx.state.user.id)
    indexes = await generateHRIndexes(hrList)

    // calcul de l'ETP pour un mois donnée
    const onCalculateETPT = async (date = dateStart) => {
      const catId = type === 'ETPTSiege' ? 1 : type === 'ETPTGreffe' ? 2 : 3
      const fonctions = (await this.models.HRFonctions.getAll()).filter((v) => v.categoryId === catId)
      let newFonctions = fonctionsIds
      if ((newFonctions || []).every((fonctionId) => !fonctions.find((f) => f.id === fonctionId))) {
        newFonctions = null
      }
      let endOfTheMonth = today(date)
      endOfTheMonth = month(endOfTheMonth, 0, 'lastday')

      const categories = await this.models.HRCategories.getAll()

      const etp = calculateETPForContentieux(
        indexes,
        {
          start: date,
          end: endOfTheMonth,
          category: undefined,
          fonctions: newFonctions,
          contentieux: contentieuxId,
        },
        categories,
      )

      let { etpMag, etpFon, etpCon } = getEtpByCategory(etp)
      return type === 'ETPTSiege' ? etpMag : type === 'ETPTGreffe' ? etpFon : etpCon
    }

    // calcul du stock pour un mois donnée
    const onCalculateStock = async (date = dateStart) => {
      const activites = await this.models.Activities.getByMonthNew(date, backupId, contentieuxId, false)
      if (activites && activites.length) {
        const acti = activites[0]
        if (acti.stock !== null) {
          return acti.stock
        } else if (acti.originalStock !== null) {
          return acti.originalStock
        } else {
          return null
        }
      }
      return undefined
    }

    // calcul des entrées pour un mois donnée
    const onCalculateEntrees = async (date = dateStart) => {
      const activites = await this.models.Activities.getByMonthNew(date, backupId, contentieuxId, false)
      if (activites && activites.length) {
        const acti = activites[0]
        if (acti.entrees !== null) {
          return acti.entrees
        } else if (acti.originalEntrees !== null) {
          return acti.originalEntrees
        } else {
          return null
        }
      }
      return undefined
    }

    // calcul des sorties pour un mois donnée
    const onCalculateSorties = async (date = dateStart) => {
      const activites = await this.models.Activities.getByMonthNew(date, backupId, contentieuxId, false)
      if (activites && activites.length) {
        const acti = activites[0]
        if (acti.sorties !== null) {
          return acti.sorties
        } else if (acti.originalSorties !== null) {
          return acti.originalSorties
        } else {
          return null
        }
      }
      return undefined
    }

    const list = []

    do {
      let endOfTheMonth = today(dateStart)
      endOfTheMonth = month(endOfTheMonth, 0, 'lastday')

      switch (type) {
        case 'entrees':
          {
            const currentEntrees = await onCalculateEntrees()
            if (currentEntrees !== undefined) {
              list.push({ value: currentEntrees, date: today(dateStart) })
            }
          }
          break
        case 'sorties':
          {
            const currentSorties = await onCalculateSorties()
            if (currentSorties !== undefined) {
              list.push({ value: currentSorties, date: today(dateStart) })
            }
          }
          break
        case 'stock':
        case 'stocks':
          {
            const currentStock = await onCalculateStock()
            if (currentStock !== undefined) {
              list.push({ value: currentStock, date: today(dateStart) })
            } else if (list.length > 0 && getNbMonth(list[list.length - 1].date, dateStart) === 1) {
              // le stock passé est bien celui du mois précédent
              list.push({ value: 1, date: today(dateStart) })
              console.log('stock passé')
            } else if (list.length === 0) {
              const lastMonth = month(dateStart, -1)
              const lastMonthStock = await onCalculateStock(lastMonth)

              if (lastMonthStock !== undefined) {
                const lastMonthEntrees = (await onCalculateEntrees(lastMonth)) || 0
                const lastMonthSorties = (await onCalculateSorties(lastMonth)) || 0
                const lastMonthETPT = (await onCalculateETPT(lastMonth)) || 0

                let estimateStock = lastMonthStock + lastMonthEntrees
                if (categorySelected === 'magistrats') {
                  estimateStock -= lastMonthETPT
                } else if (categorySelected === 'fonctionnaires') {
                  estimateStock -= lastMonthETPT
                } else {
                  estimateStock = null
                }
                list.push({ value: estimateStock, date: today(dateStart) })

                console.log('list vide', lastMonthStock, lastMonthEntrees, lastMonthSorties, lastMonthETPT)
              } else {
                console.log('stock passé du mois précédent n\'existe pas')
              }
            } else {
              console.log('stock non passé', list.length > 0)
            }
          }
          break
        case 'etpt':
        case 'ETPTEam':
        case 'ETPTGreffe':
        case 'ETPTSiege':
          {
            list.push({ value: await onCalculateETPT(), date: today(dateStart) })
          }
          break
        case 'dtes':
          {
            const catId = categorySelected === 'magistrats' ? 1 : 2
            const datas = await this.model.onCalculate(
              {
                backupId,
                dateStart,
                dateStop: endOfTheMonth,
                contentieuxIds: [contentieuxId],
                categorySelected: catId,
                selectedFonctionsIds: fonctionsIds,
                loadChildrens: false,
              },
              ctx.state.user,
              false,
            )

            list.push({
              value: datas.list[0].realDTESInMonths,
              date: today(dateStart),
            })
          }
          break
        case 'temps-moyen':
          {
            const catId = categorySelected === 'magistrats' ? 1 : 2
            const datas = await this.model.onCalculate(
              {
                backupId,
                dateStart,
                dateStop: endOfTheMonth,
                contentieuxIds: [contentieuxId],
                categorySelected: catId,
                selectedFonctionsIds: fonctionsIds,
                loadChildrens: false,
              },
              ctx.state.user,
              false,
            )

            list.push({
              value: catId === 1 ? datas.list[0].magRealTimePerCase : datas.list[0].fonRealTimePerCase,
              date: today(dateStart),
            })
          }
          break
        case 'taux-couverture':
        case 'coverage':
          {
            const activites = await this.models.Activities.getByMonthNew(dateStart, backupId, contentieuxId, false)
            if (activites.length) {
              const acti = activites[0]

              let sorties = null
              if (acti.sorties !== null) {
                sorties = acti.sorties
              } else if (acti.originalSorties !== null) {
                sorties = acti.originalSorties
              }

              let entrees = null
              if (acti.entrees !== null) {
                entrees = acti.entrees
              } else if (acti.originalEntrees !== null) {
                entrees = acti.originalEntrees
              }

              if (sorties !== null && entrees !== null) {
                list.push({
                  value: Math.floor(fixDecimal(sorties / entrees, 100) * 100),
                  date: today(dateStart),
                })
              } else {
                list.push({
                  value: null,
                  date: today(dateStart),
                })
              }
            }
          }
          break
        default:
          {
            console.log('type', type)
          }
          break
      }

      dateStart = month(dateStart, 1)
    } while (dateStart.getTime() <= dateStop.getTime())

    this.sendOk(ctx, list)
  }
}
