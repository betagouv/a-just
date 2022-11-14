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

    console.time('simulator-1.1')
    //hr = await filterByCategory(hr, categoryId, functionIds)
    console.timeEnd('simulator-1.1')

    let counter = 0
    hr.map((human) => {
      counter += human.situations.length
    })

    console.log({ counter })
    console.log({ filteredHr: hr.length })

    console.time('simulator-2')
    const categories = await this.models.HRCategories.getAll()
    console.timeEnd('simulator-2')

    console.log(categories)

    console.time('simulator-3')
    const activities = await this.models.Activities.getAll(backupId)
    console.timeEnd('simulator-3')

    console.time('simulator-4')
    const situation = await getSituation(referentielId, hr, activities, categories, dateStart, dateStop, categoryId)
    console.timeEnd('simulator-4')

    this.sendOk(ctx, { situation, categories, hr })
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
