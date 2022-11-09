import Route, { Access } from './Route'
import { Types } from '../utils/types'
import { execSimulation, getSituation } from '../utils/simulator'

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
    const hr1 = await this.model.getCache(backupId)

    const hr = await hr1.filter((human) => {
      const situations = (human.situations || []).filter((s) => {
        s.category && s.category.id === categoryId
      })
      console.log({ situations })
      if (situations.length && situations.every((s) => s.fonction && functionIds.indexOf(s.fonction.id) === -1)) {
        return false
      }
      return true
    })
    console.log({ hr: hr1.length, filteredHr: hr.length, functionIds: functionIds })

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
