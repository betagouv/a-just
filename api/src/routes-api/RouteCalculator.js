import Route, { Access } from './Route'
import { Types } from '../utils/types'
import { month, today } from '../utils/date'
import { loadOrWarmHR } from '../utils/redis'
import { fixDecimal } from '../utils/number'
import { calculateETPForContentieux, generateHRIndexes } from '../utils/human-resource'
import { getEtpByCategory } from '../utils/simulator'
import { meanBy } from 'lodash'
import config from 'config'

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
      log: Types.boolean(),
    }),
    accesses: [Access.canVewCalculator],
  })
  async filterList(ctx) {
    const { backupId } = this.body(ctx)

    if (!(await this.models.HRBackups.haveAccess(backupId, ctx.state.user.id))) {
      ctx.throw(401, "Vous n'avez pas accès à cette juridiction !")
    }

    console.log('this.body(ctx)', this.body(ctx))

    this.sendOk(ctx, await this.model.onCalculate(this.body(ctx), ctx.state.user, this.body(ctx).log === false ? false : true))
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
      let localType = null
      if (['ETPTEam', 'ETPTGreffe', 'ETPTSiege'].includes(type)) {
        localType = type
      } else {
        localType = categorySelected === 'magistrats' ? 'ETPTSiege' : (categorySelected === 'fonctionnaires' ? 'ETPTGreffe' : 'ETPTEam')
      }

      const catId = localType === 'ETPTSiege' ? 1 : localType === 'ETPTGreffe' ? 2 : 3
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
      return localType === 'ETPTSiege' ? etpMag : localType === 'ETPTGreffe' ? etpFon : etpCon
    }

    // calcul du stock pour un mois donnée
    const onCalculateStock = async (date = dateStart, loop = false) => {
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

      if (loop) {
        let nbMonths = 12
        let lastMonth = date
        let valuesSaved = []
        do {
          nbMonths--
          lastMonth = month(lastMonth, -1)
          const lastMonthStock = await onCalculateStock(lastMonth, false)
          if (lastMonthStock !== undefined) {
            valuesSaved.push(lastMonthStock)
          }
        } while (nbMonths > 0)
        return meanBy(valuesSaved) || 0
      }

      return undefined
    }

    // calcul des entrées pour un mois donnée
    const onCalculateEntrees = async (date = dateStart, loop = false) => {
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

      if (loop) {
        let nbMonths = 12
        let lastMonth = new Date(date)
        let valuesSaved = []
        do {
          nbMonths--
          lastMonth = month(lastMonth, -1)
          const lastMonthEntrees = await onCalculateEntrees(lastMonth)
          if (lastMonthEntrees !== undefined) {
            valuesSaved.push(lastMonthEntrees)
          }
        } while (nbMonths > 0)
        return meanBy(valuesSaved) || 0
      }

      return undefined
    }

    // calcul des sorties pour un mois donnée
    const onCalculateSorties = async (date = dateStart, loop = false) => {
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

      if (loop) {
        let nbMonths = 12
        let lastMonth = date
        let valuesSaved = []
        do {
          nbMonths--
          lastMonth = month(lastMonth, -1)
          const lastMonthSorties = await onCalculateSorties(lastMonth, false)
          if (lastMonthSorties !== undefined) {
            valuesSaved.push(lastMonthSorties)
          }
        } while (nbMonths > 0)
        return meanBy(valuesSaved) || 0
      }

      return undefined
    }

    // calcul du temps moyen pour un mois donnée
    const onCalculateTempsMoyen = async () => {
      let endOfTheMonth = today(dateStart)
      endOfTheMonth = month(endOfTheMonth, 0, 'lastday')

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

      return datas.list.length > 0 ? datas.list[0].magRealTimePerCase || datas.list[0].fonRealTimePerCase : null
    }

    const list = []
    let lockEntrees = null
    let lockSorties = null

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
            } else {
              const lastMonth = month(dateStart, -1)
              const lastStock = list.length > 0 ? list[list.length - 1].value : await onCalculateStock(lastMonth, true)
              const lastMonthEntrees = lockEntrees || (await onCalculateEntrees(dateStart, true)) || 0
              const lastMonthSorties = lockSorties || (await onCalculateSorties(dateStart, true)) || 0
              const etpt = (await onCalculateETPT()) || 0
              const tempsMoyen = await onCalculateTempsMoyen()

              // save datas for next month
              if (lockEntrees === null) {
                lockEntrees = lastMonthEntrees
              }
              if (lockSorties === null) {
                lockSorties = lastMonthSorties
              }

              console.log('lastMonthEntrees', lastMonthEntrees)
              console.log('lastMonthSorties', lastMonthSorties)
              console.log('etpt', etpt)
              console.log('tempsMoyen', tempsMoyen)
              if (tempsMoyen !== Infinity) {
                let estimateStock = (lastStock || 0) + (lastMonthEntrees || 0)
                if (categorySelected === 'magistrats') {
                  estimateStock -= ((etpt * (config.nbDaysByMagistrat / 12) * config.nbHoursPerDayAndMagistrat || 0) / tempsMoyen || 0)
                } else if (categorySelected === 'fonctionnaires') {
                  estimateStock -= ((etpt * (config.nbDaysByFonctionnaire / 12) * config.nbHoursPerDayAndFonctionnaire || 0) / tempsMoyen || 0)
                } else {
                  estimateStock -= (lastMonthSorties || 0)
                }

                // control stock ne peut pas être négatif
                if (estimateStock < 0) {
                  estimateStock = 0
                } else {
                  estimateStock = Math.floor(estimateStock)
                }

                list.push({ value: estimateStock, date: today(dateStart) })
              }
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

            console.log('datas.list[0].realDTESInMonths', datas.list[0].realDTESInMonths)
            if (datas.list[0].realDTESInMonths !== null) {
              list.push({
                value: datas.list[0].realDTESInMonths,
                date: today(dateStart),
              })
            } else {
              const lastMonth = month(dateStart, -1)
              const lastStock = list.length > 0 ? list[list.length - 1].value : await onCalculateStock(lastMonth, true)
              const lastMonthEntrees = lockEntrees || (await onCalculateEntrees(dateStart, true)) || 0
              const lastMonthSorties = lockSorties || (await onCalculateSorties(dateStart, true)) || 0
              const etpt = (await onCalculateETPT()) || 0
              const tempsMoyen = await onCalculateTempsMoyen()

              // save datas for next month
              if (lockEntrees === null) {
                lockEntrees = lastMonthEntrees
              }
              if (lockSorties === null) {
                lockSorties = lastMonthSorties
              }

              console.log('lastMonthEntrees', lastMonthEntrees)
              console.log('lastMonthSorties', lastMonthSorties)
              console.log('etpt', etpt)
              console.log('tempsMoyen', tempsMoyen)
              if (tempsMoyen !== Infinity) {
                let estimateStock = (lastStock || 0) + (lastMonthEntrees || 0)
                if (categorySelected === 'magistrats') {
                  estimateStock -= ((etpt * (config.nbDaysByMagistrat / 12) * config.nbHoursPerDayAndMagistrat || 0) / tempsMoyen || 0)
                } else if (categorySelected === 'fonctionnaires') {
                  estimateStock -= ((etpt * (config.nbDaysByFonctionnaire / 12) * config.nbHoursPerDayAndFonctionnaire || 0) / tempsMoyen || 0)
                } else {
                  estimateStock -= (lastMonthSorties || 0)
                }

                // control stock ne peut pas être négatif
                if (estimateStock < 0) {
                  estimateStock = 0
                }

                list.push({ value: estimateStock / lastMonthSorties, date: today(dateStart) })
              }
            }
          }
          break
        case 'temps-moyen':
          {
            list.push({
              value: await onCalculateTempsMoyen(),
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
