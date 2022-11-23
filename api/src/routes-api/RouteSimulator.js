import Route, { Access } from './Route'
import { Types } from '../utils/types'
import { execSimulation, filterByCategory, getSituation } from '../utils/simulator'

export default class RouteSimulator extends Route {
  constructor (params) {
    super({ ...params, model: 'HumanResources' })
  }

  @Route.Post({
    bodyType: Types.object().keys({
      backupId: Types.number().required(),
      referentielId: Types.number().required(),
      dateStart: Types.date(),
      dateStop: Types.date(),
      functionIds: Types.array(),
      categoryId: Types.number(),
    }),
    accesses: [Access.canVewHR],
  })
  async getSituation (ctx) {
    let { backupId, referentielId, dateStart, dateStop, functionIds, categoryId } = this.body(ctx)

    if (!(await this.models.HRBackups.haveAccess(backupId, ctx.state.user.id))) {
      ctx.throw(401, "Vous n'avez pas accès à cette juridiction !")
    }

    console.time('simulator-1')
    let hr = await this.model.getCache(backupId)
    console.timeEnd('simulator-1')

    console.log(functionIds, categoryId)
    console.log({ hr: hr.length })

    console.time('simulator-2')
    const categories = await this.models.HRCategories.getAll()
    console.timeEnd('simulator-2')

    console.log(categories)

    console.time('simulator-3')
    const activities = await this.models.Activities.getAll(backupId)
    console.timeEnd('simulator-3')

    const situation = await getSituation(referentielId, hr, activities, categories, dateStart, dateStop, categoryId)

    console.time('simulator-1.1')
    const hrfiltered = await filterByCategory(hr, categoryId, functionIds)
    console.timeEnd('simulator-1.1')

    console.time('simulator-4')
    const situationFiltered = await getSituation(referentielId, hrfiltered, activities, categories, dateStart, dateStop, categoryId)
    console.timeEnd('simulator-4')

    let counter = 0
    hr.map((human) => {
      counter += human.situations.length
    })

    let counterfiltered = 0
    hrfiltered.map((human) => {
      counterfiltered += human.situations.length
    })

    console.log(situationFiltered, situation)

    categories.map((x) => {
      if (x.id !== categoryId) {
        if (x.id === 1) situationFiltered.etpMag = situation.etpMag
        if (x.id === 2) situationFiltered.etpFon = situation.etpFon
        if (x.id === 3) situationFiltered.etpCont = situation.etpCont

        if (situation.endSituation) {
          situationFiltered.endSituation.monthlyReport[x.id - 1] = situation.endSituation.monthlyReport[x.id - 1]
          if (x.id === 1) situationFiltered.endSituation.etpMag = situation.endSituation.etpMag
          if (x.id === 2) situationFiltered.endSituation.etpFon = situation.endSituation.etpFon
          if (x.id === 3) situationFiltered.endSituation.etpCont = situation.endSituation.etpCont
        }
      }
    })

    /**
    if (situation.endSituation) {
      console.log('monthlyReportsituationFiltered')
      situationFiltered.endSituation.monthlyReport.map((x) => console.log(x))
      console.log('monthlyReportAllSituation')
      situation.endSituation.monthlyReport.map((x) => console.log(x))

      console.log('etpMag', situation.endSituation.etpMag, situationFiltered.endSituation.etpMag)
      console.log('etpFon', situation.endSituation.etpFon, situationFiltered.endSituation.etpFon)
      console.log('etpCont', situation.endSituation.etpCont, situationFiltered.endSituation.etpCont)
    }

    console.log({ allHr: hr.length, counter })
    console.log({ filteredHr: hrfiltered.length, counterfiltered })
    */

    this.sendOk(ctx, { situation: situationFiltered, categories, hr })
  }

  @Route.Post({
    bodyType: Types.object().keys({
      backupId: Types.number().required(),
      params: Types.any().required(),
      simulation: Types.object().required(),
      dateStart: Types.date().required(),
      dateStop: Types.date().required(),
      selectedCategoryId: Types.number().required(),
    }),
    accesses: [Access.canVewHR],
  })
  async toSimulate (ctx) {
    let { backupId, params, simulation, dateStart, dateStop, selectedCategoryId } = this.body(ctx)

    if (!(await this.models.HRBackups.haveAccess(backupId, ctx.state.user.id))) {
      ctx.throw(401, "Vous n'avez pas accès à cette juridiction !")
    }

    const categories = await this.models.HRCategories.getAll()

    let sufix = 'By' + categories.find((element) => element.id === selectedCategoryId).label

    const simulatedSituation = execSimulation(params, simulation, dateStart, dateStop, sufix)
    this.sendOk(ctx, simulatedSituation)
  }
}
