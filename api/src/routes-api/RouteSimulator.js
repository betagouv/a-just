import Route, { Access } from './Route'
import { Types } from '../utils/types'
import { execSimulation, filterByCategoryAndFonction, getSituation, mergeSituations } from '../utils/simulator'
import { copyArray } from '../utils/array'
import { canHaveUserCategoryAccess } from '../utils/hr-catagories'
import { HAS_ACCESS_TO_CONTRACTUEL, HAS_ACCESS_TO_GREFFIER, HAS_ACCESS_TO_MAGISTRAT } from '../constants/access'

/**
 * Route pour la page du simulateur
 */

export default class RouteSimulator extends Route {
  /**
   * Constructeur
   * @param {*} params
   */
  constructor (params) {
    super({ ...params, model: 'HumanResources' })
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

    console.time('simulator-2')
    const categories = await this.models.HRCategories.getAll()
    console.timeEnd('simulator-2')

    console.time('simulator-3')
    const activities = await this.models.Activities.getAll(backupId)
    console.timeEnd('simulator-3')

    const situation = await getSituation(referentielId, hr, activities, categories, dateStart, dateStop, categoryId)

    console.time('simulator-1.1')
    const hrfiltered = filterByCategoryAndFonction(copyArray(hr), categoryId, functionIds)
    console.timeEnd('simulator-1.1')

    console.time('simulator-4')
    let situationFiltered = await getSituation(referentielId, hrfiltered, activities, categories, dateStart, dateStop, categoryId)
    console.timeEnd('simulator-4')

    situationFiltered = mergeSituations(situationFiltered, situation, categories, categoryId)

    console.log(situationFiltered)
    situationFiltered = {
      ...situationFiltered,
      etpMag: canHaveUserCategoryAccess(ctx.state.user, HAS_ACCESS_TO_MAGISTRAT) ? situationFiltered.etpMag : null,
      etpFon: canHaveUserCategoryAccess(ctx.state.user, HAS_ACCESS_TO_GREFFIER) ? situationFiltered.etpFon : null,
      etpCont: canHaveUserCategoryAccess(ctx.state.user, HAS_ACCESS_TO_CONTRACTUEL) ? situationFiltered.etpCont : null,
    }

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
    console.log('Yoko', params)

    this.sendOk(ctx, simulatedSituation)
  }
}
