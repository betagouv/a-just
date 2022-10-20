import Route, { Access } from './Route'
import { Types } from '../utils/types'
import { emptyCalulatorValues, syncCalculatorDatas } from '../utils/calculator'
import { getNbMonth } from '../utils/date'
import { FONCTIONNAIRES, MAGISTRATS } from '../constants/categories'

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
    const {
      backupId,
      dateStart,
      dateStop,
      contentieuxIds,
      optionBackupId,
      categorySelected,
      selectedFonctionsIds,
    } = this.body(ctx)
    let fonctions = await this.models.HRFonctions.getAll()

    if (categorySelected === MAGISTRATS) {
      fonctions = fonctions.filter((f) => f.categoryId === 1)
    } else if (categorySelected === FONCTIONNAIRES) {
      fonctions = fonctions.filter((f) => f.categoryId === 2)
    }

    if (
      !(await this.models.HRBackups.haveAccess(backupId, ctx.state.user.id))
    ) {
      ctx.throw(401, "Vous n'avez pas accès à cette juridiction !")
    }

    console.time('calculator-1')
    const referentiels = (
      await this.models.ContentieuxReferentiels.getReferentiels()
    ).filter((c) => contentieuxIds.indexOf(c.id) !== -1)
    console.timeEnd('calculator-1')

    console.time('calculator-2')
    const optionsBackups = await this.models.ContentieuxOptions.getAllById(
      optionBackupId
    )
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
    hr = hr.filter((human) => {
      if (
        (categorySelected === MAGISTRATS ||
          categorySelected === FONCTIONNAIRES) &&
        selectedFonctionsIds
      ) {
        const situations = (human.situations || []).filter(
          (s) =>
            s.category &&
            s.category.id === (categorySelected === MAGISTRATS ? 1 : 2)
        )

        if (
          situations.length &&
          situations.every(
            (s) =>
              s.fonction && selectedFonctionsIds.indexOf(s.fonction.id) === -1
          )
        ) {
          return false
        }
      }

      return true
    })
    console.timeEnd('calculator-6-2')

    console.time('calculator-7')
    const activities = await this.models.Activities.getAll(backupId)
    console.timeEnd('calculator-7')

    console.time('calculator-8')
    list = syncCalculatorDatas(
      list,
      nbMonth,
      activities,
      dateStart,
      dateStop,
      hr,
      categories,
      optionsBackups
    )
    console.timeEnd('calculator-8')

    this.sendOk(ctx, { fonctions, list })
  }
}
