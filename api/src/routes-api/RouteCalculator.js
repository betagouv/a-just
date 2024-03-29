import Route, { Access } from './Route'
import { Types } from '../utils/types'
import { emptyCalulatorValues, syncCalculatorDatas } from '../utils/calculator'
import { getNbMonth, month } from '../utils/date'
import { FONCTIONNAIRES, MAGISTRATS } from '../constants/categories'
import { canHaveUserCategoryAccess } from '../utils/hr-catagories'
import { HAS_ACCESS_TO_CONTRACTUEL, HAS_ACCESS_TO_GREFFIER, HAS_ACCESS_TO_MAGISTRAT } from '../constants/access'
import { EXECUTE_CALCULATOR, EXECUTE_CALCULATOR_CHANGE_DATE } from '../constants/log-codes'

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
    }),
    accesses: [Access.canVewCalculator],
  })
  async filterList (ctx) {
    const { backupId, dateStart, dateStop, contentieuxIds, optionBackupId, categorySelected, selectedFonctionsIds } = this.body(ctx)
    const lastMonthStock = await this.model.models.Activities.getLastMonth(backupId)

    if (!selectedFonctionsIds) {
      // memorize first execution by user
      await this.models.Logs.addLog(EXECUTE_CALCULATOR, ctx.state.user.id)
    }

    if (
      lastMonthStock &&
      (month(dateStart).getTime() !== month(lastMonthStock, -2).getTime() || month(dateStop).getTime() !== month(lastMonthStock).getTime())
    ) {
      await this.models.Logs.addLog(EXECUTE_CALCULATOR_CHANGE_DATE, ctx.state.user.id)
    }
    let fonctions = await this.models.HRFonctions.getAll()
    let categoryIdSelected = -1
    switch (categorySelected) {
    case MAGISTRATS:
      categoryIdSelected = 1
      break
    case FONCTIONNAIRES:
      categoryIdSelected = 2
      break
    default:
      categoryIdSelected = 3
      break
    }

    fonctions = fonctions.filter((f) => f.categoryId === categoryIdSelected)

    if (!(await this.models.HRBackups.haveAccess(backupId, ctx.state.user.id))) {
      ctx.throw(401, "Vous n'avez pas accès à cette juridiction !")
    }

    console.time('calculator-1')
    const referentiels = (await this.models.ContentieuxReferentiels.getReferentiels()).filter((c) => contentieuxIds.indexOf(c.id) !== -1)
    console.timeEnd('calculator-1')

    console.time('calculator-2')
    const optionsBackups = optionBackupId ? await this.models.ContentieuxOptions.getAllById(optionBackupId) : []
    console.timeEnd('calculator-2')

    console.time('calculator-3')
    let list = emptyCalulatorValues(referentiels)
    console.timeEnd('calculator-3')

    console.time('calculator-4')
    const nbMonth = getNbMonth(dateStart, dateStop)
    console.timeEnd('calculator-4')

    console.time('calculator-5')
    const categories = await this.models.HRCategories.getAll()
    console.timeEnd('calculator-5')

    console.time('calculator-6')
    let hr = await this.model.getCache(backupId)
    console.timeEnd('calculator-6')

    console.time('calculator-6-2')
    // filter by fonctions
    hr = hr
      .map((human) => {
        let situations = human.situations || []

        situations = situations.filter(
          (s) =>
            (s.category && s.category.id !== categoryIdSelected) ||
            (selectedFonctionsIds && selectedFonctionsIds.length && s.fonction && selectedFonctionsIds.indexOf(s.fonction.id) !== -1) ||
            (!selectedFonctionsIds && s.category && s.category.id === categoryIdSelected)
        )

        return {
          ...human,
          situations,
        }
      })
      .filter((h) => h.situations.length)

    console.timeEnd('calculator-6-2')

    console.time('calculator-7')
    const activities = await this.models.Activities.getAll(backupId)
    console.timeEnd('calculator-7')

    console.time('calculator-8')
    list = syncCalculatorDatas(list, nbMonth, activities, dateStart, dateStop, hr, categories, optionsBackups)

    const cleanDataToSent = (item) => ({
      ...item,
      etpMag: canHaveUserCategoryAccess(ctx.state.user, HAS_ACCESS_TO_MAGISTRAT) ? item.etpMag : null,
      magRealTimePerCase: canHaveUserCategoryAccess(ctx.state.user, HAS_ACCESS_TO_MAGISTRAT) ? item.magRealTimePerCase : null,
      magCalculateCoverage: canHaveUserCategoryAccess(ctx.state.user, HAS_ACCESS_TO_MAGISTRAT) ? item.magCalculateCoverage : null,
      magCalculateDTESInMonths: canHaveUserCategoryAccess(ctx.state.user, HAS_ACCESS_TO_MAGISTRAT) ? item.magCalculateDTESInMonths : null,
      magCalculateTimePerCase: canHaveUserCategoryAccess(ctx.state.user, HAS_ACCESS_TO_MAGISTRAT) ? item.magCalculateTimePerCase : null,
      magCalculateOut: canHaveUserCategoryAccess(ctx.state.user, HAS_ACCESS_TO_MAGISTRAT) ? item.magCalculateOut : null,
      etpFon: canHaveUserCategoryAccess(ctx.state.user, HAS_ACCESS_TO_GREFFIER) ? item.etpFon : null,
      fonRealTimePerCase: canHaveUserCategoryAccess(ctx.state.user, HAS_ACCESS_TO_GREFFIER) ? item.fonRealTimePerCase : null,
      fonCalculateCoverage: canHaveUserCategoryAccess(ctx.state.user, HAS_ACCESS_TO_GREFFIER) ? item.fonCalculateCoverage : null,
      fonCalculateDTESInMonths: canHaveUserCategoryAccess(ctx.state.user, HAS_ACCESS_TO_GREFFIER) ? item.fonCalculateDTESInMonths : null,
      fonCalculateTimePerCase: canHaveUserCategoryAccess(ctx.state.user, HAS_ACCESS_TO_GREFFIER) ? item.fonCalculateTimePerCase : null,
      fonCalculateOut: canHaveUserCategoryAccess(ctx.state.user, HAS_ACCESS_TO_GREFFIER) ? item.fonCalculateOut : null,
      etpCont: canHaveUserCategoryAccess(ctx.state.user, HAS_ACCESS_TO_CONTRACTUEL) ? item.etpCont : null,
    })

    list = list.map((item) => ({
      ...cleanDataToSent(item),
      childrens: (item.childrens || []).map(cleanDataToSent),
    }))

    console.timeEnd('calculator-8')

    this.sendOk(ctx, { fonctions, list })
  }
}
