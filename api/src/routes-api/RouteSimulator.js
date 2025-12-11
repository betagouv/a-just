import Route, { Access } from './Route'
import { Types } from '../utils/types'
import { execSimulation, getSituation, mergeSituations } from '../utils/simulator'
import {
  EXECUTE_LAUNCH_SIMULATOR,
  EXECUTE_LAUNCH_WHITE_SIMULATOR,
  EXECUTE_SIMULATION,
  EXECUTE_SIMULATOR_PARAM,
  EXECUTE_WHITE_SIMULATOR,
} from '../constants/log-codes'
import { loadOrWarmHR } from '../utils/redis'
import { generateHRIndexes } from '../utils/human-resource'
import { month, today } from '../utils/date'

/**
 * Route pour la page du simulateur
 */

export default class RouteSimulator extends Route {
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
   * Interface de retourne pour les précalcul du simulateur
   * @param {*} backupId
   * @param {*} referentielId
   * @param {*} dateStart
   * @param {*} dateStop
   * @param {*} functionIds
   * @param {*} categoryId
   */
  @Route.Post({
    bodyType: Types.object().keys({
      backupId: Types.number().required(),
      referentielId: Types.array().required(),
      dateStart: Types.date(),
      dateStop: Types.date(),
      functionIds: Types.array(),
      categoryId: Types.number().required(),
    }),
    accesses: [Access.canVewSimulation],
  })
  async getSituation(ctx) {
    let { backupId, referentielId, dateStart, dateStop, functionIds, categoryId } = this.body(ctx)

    if (!(await this.models.HRBackups.haveAccess(backupId, ctx.state.user.id))) {
      ctx.throw(401, "Vous n'avez pas accès à cette juridiction !")
    }

    console.time('simulator-1')
    let hr = await loadOrWarmHR(backupId, this.models, ctx.state.user.id)
    console.timeEnd('simulator-1')

    console.time('🧩 Pré-formatage / Indexation')
    const indexes = await generateHRIndexes(hr)
    console.timeEnd('🧩 Pré-formatage / Indexation')

    console.time('simulator-2')
    const categories = await this.models.HRCategories.getAll()
    const fonctions = (await this.models.HRFonctions.getAll()).filter((v) => v.categoryId === categoryId).map((f) => f.id)
    const fctFilter = functionIds.length == fonctions.length ? undefined : functionIds
    console.timeEnd('simulator-2')

    console.time('simulator-3')
    const activities = await this.models.Activities.getAll(backupId)
    console.timeEnd('simulator-3')

    const situation = await getSituation(referentielId, hr, activities, categories, dateStart, dateStop, categoryId, undefined, indexes, true, true)

    console.time('simulator-4')
    let situationFiltered = await getSituation(
      referentielId,
      hr,
      activities,
      categories,
      dateStart,
      dateStop,
      categoryId,
      undefined,
      indexes,
      true,
      true,
      fctFilter,
    )
    console.timeEnd('simulator-4')
    situationFiltered = mergeSituations(situationFiltered, situation, categories, categoryId, ctx)

    this.sendOk(ctx, { situation: situationFiltered, categories, hr })
  }

  /**
   * Interface de résultat de simulation de la page de simulation
   * @param {*} backupId
   * @param {*} params
   * @param {*} simulation
   * @param {*} dateStart
   * @param {*} dateStop
   * @param {*} selectedCategoryId
   */
  @Route.Post({
    bodyType: Types.object().keys({
      backupId: Types.number().required(),
      params: Types.any().required(),
      simulation: Types.object().required(),
      dateStart: Types.date().required(),
      dateStop: Types.date().required(),
      selectedCategoryId: Types.number().required(),
    }),
    accesses: [Access.canVewSimulation],
  })
  async toSimulate(ctx) {
    let { backupId, params, simulation, dateStart, dateStop, selectedCategoryId } = this.body(ctx)

    if (!(await this.models.HRBackups.haveAccess(backupId, ctx.state.user.id))) {
      ctx.throw(401, "Vous n'avez pas accès à cette juridiction !")
    }

    const categories = await this.models.HRCategories.getAll()

    let sufix = 'By' + categories.find((element) => element.id === selectedCategoryId).label

    await this.models.Logs.addLog(EXECUTE_SIMULATOR_PARAM, ctx.state.user.id, params)

    const simulatedSituation = execSimulation(params, simulation, dateStart, dateStop, sufix, ctx)


    /**
     *     console.log(simulatedSituation.realTimePerCase)

    totalOut = computeTotalOut(realTimePerCase, selectedCategoryId === 1 ? etpMag : etpFon, sufix)

    let listDTES = []

    do {
      let endOfTheMonth = today(dateStart)
      endOfTheMonth = month(endOfTheMonth, 0, 'lastday')
      {
        const datas = [] // mettre les ETPTS

        console.log(datas)

        listDTES.push({
          //value: datas.list[0].realDTESInMonths,
          date: today(dateStart),
        })
      }

      dateStart = month(dateStart, 1)
    } while (dateStart.getTime() <= dateStop.getTime())
    console.log(listDTES)
  */

    if (simulatedSituation === null) ctx.throw(400, 'Une erreur est survenue lors de votre simulation, veuillez réessayer !')
    else this.sendOk(ctx, simulatedSituation)
  }

  /**
   * Interface de résultat de simulation de la page de simulation
   * @param {*} backupId
   * @param {*} params
   * @param {*} simulation
   * @param {*} dateStart
   * @param {*} dateStop
   * @param {*} selectedCategoryId
   */
  @Route.Post({
    bodyType: Types.object().keys({
      backupId: Types.number().required(),
      params: Types.any().required(),
      simulation: Types.object().required(),
      dateStart: Types.date().required(),
      dateStop: Types.date().required(),
      selectedCategoryId: Types.number().required(),
    }),
    accesses: [Access.canVewWhiteSimulation],
  })
  async toSimulateWhite(ctx) {
    let { backupId, params, simulation, dateStart, dateStop, selectedCategoryId } = this.body(ctx)

    if (!(await this.models.HRBackups.haveAccess(backupId, ctx.state.user.id))) {
      ctx.throw(401, "Vous n'avez pas accès à cette juridiction !")
    }

    const categories = await this.models.HRCategories.getAll()

    let sufix = 'By' + categories.find((element) => element.id === selectedCategoryId).label

    await this.models.Logs.addLog(EXECUTE_SIMULATOR_PARAM, ctx.state.user.id, params)

    const simulatedSituation = execSimulation(params, simulation, dateStart, dateStop, sufix, ctx)

    if (simulatedSituation === null) ctx.throw(400, 'Une erreur est survenue lors de votre simulation, veuillez réessayer !')
    else this.sendOk(ctx, simulatedSituation)
  }

  /**
   * Log lancement simulation à blanc
   * @param {*} node
   * @param {*} juridictionId
   */
  @Route.Post({
    bodyType: Types.object().keys({
      params: Types.any().required(),
    }),
    accesses: [Access.canVewWhiteSimulation],
  })
  async logLaunchWhiteSimulation(ctx) {
    let { params } = this.body(ctx)
    await this.models.Logs.addLog(EXECUTE_LAUNCH_WHITE_SIMULATOR, ctx.state.user.id, { ...params })
    this.sendOk(ctx, 'Ok')
  }

  /**
   * Log lancement simulation classique
   * @param {*} node
   * @param {*} juridictionId
   */
  @Route.Post({
    bodyType: Types.object().keys({
      params: Types.any().required(),
    }),
    accesses: [Access.canVewSimulation],
  })
  async logLaunchSimulation(ctx) {
    let { params } = this.body(ctx)
    await this.models.Logs.addLog(EXECUTE_LAUNCH_SIMULATOR, ctx.state.user.id, { ...params })
    this.sendOk(ctx, 'Ok')
  }

  /**
   * Log accès au simulateur à blanc
   * @param {*} node
   * @param {*} juridictionId
   */
  @Route.Post({
    accesses: [Access.canVewSimulation],
  })
  async logWhiteSimulation(ctx) {
    await this.models.Logs.addLog(EXECUTE_WHITE_SIMULATOR, ctx.state.user.id)
    this.sendOk(ctx, 'Ok')
  }

  /**
   * Log accès au simulateur classique
   * @param {*} node
   * @param {*} juridictionId
   */
  @Route.Post({
    accesses: [Access.canVewSimulation],
  })
  async logSimulation(ctx) {
    await this.models.Logs.addLog(EXECUTE_SIMULATION, ctx.state.user.id)
    this.sendOk(ctx, 'Ok')
  }
}
