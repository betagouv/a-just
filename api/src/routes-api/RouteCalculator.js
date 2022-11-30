import Route, { Access } from './Route'
import { Types } from '../utils/types'
import { emptyCalulatorValues, syncCalculatorDatas } from '../utils/calculator'
import { getNbMonth } from '../utils/date'
import { FONCTIONNAIRES, MAGISTRATS } from '../constants/categories'
import { copyArray } from '../utils/array'

export default class RouteCalculator extends Route {
  constructor (params) {
    super({ ...params, model: 'HumanResources' })
  }

  @Route.Post({
    bodyType: Types.object().keys({
      backupId: Types.number().required(),
      dateStart: Types.date().required(),
      dateStop: Types.date().required(),
      contentieuxIds: Types.array().required(),
      optionBackupId: Types.number().required(),
      categorySelected: Types.string().required(),
      selectedFonctionsIds: Types.array(),
    }),
    accesses: [Access.canVewHR],
  })
  async filterList (ctx) {
    const { backupId, dateStart, dateStop, contentieuxIds, optionBackupId, categorySelected, selectedFonctionsIds } = this.body(ctx)
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
    const optionsBackups = await this.models.ContentieuxOptions.getAllById(optionBackupId)
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
    console.timeEnd('calculator-8')

    this.sendOk(ctx, { fonctions, list })
  }
}
