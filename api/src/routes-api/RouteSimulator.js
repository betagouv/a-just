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

    console.log(functionIds, categoryId)
    console.log({ hr: hr.length })

    hr = await filterByCategory(hr, categoryId)

    hr.map((m) => {
      console.log({ id: m.id })
      //console.log(m.situations)
      m.situations.map((s) => console.log({ fct: s.fonction.code, cat: s.category.label }))
    })

    let counter = 0
    hr.map((human) => {
      counter += human.situations.length
    })

    console.log({ counter })
    console.log({ filteredHr: hr.length })

    /**
     * 
     * 
     * for (let i = 0; i < hr.length; i++) {
  if (hr[i].situations && hr[i].situations.length !== 0) {
    //console.log(i, hr[i].situations)
    hr[i].situations = [
      ...hr[i].situations.filter((s) => {
        if (s.fonction !== null && functionIds.includes(s.fonction.id)) return true
        return false
      }),
    ]
    //hr[i].situations = {}
    //console.log('MAA###########', i, hr[i].situations)
  }
}

     */
    console.timeEnd('simulator-1')

    console.time('simulator-2')
    const categories = await this.models.HRCategories.getAll()
    console.timeEnd('simulator-2')

    console.time('simulator-3')
    const activities = await this.models.Activities.getAll(backupId)
    console.timeEnd('simulator-3')

    console.time('simulator-4')
    const situation = await getSituation(referentielId, hr, activities, categories, dateStart, dateStop)
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
    }),
    accesses: [Access.canVewHR],
  })
  async toSimulate (ctx) {
    let { backupId, params, simulation, dateStart, dateStop } = this.body(ctx)

    if (!(await this.models.HRBackups.haveAccess(backupId, ctx.state.user.id))) {
      ctx.throw(401, "Vous n'avez pas accès à cette juridiction !")
    }

    const simulatedSituation = execSimulation(params, simulation, dateStart, dateStop)
    this.sendOk(ctx, simulatedSituation)
  }
}
