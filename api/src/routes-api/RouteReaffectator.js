import Route, { Access } from './Route'
import { Types } from '../utils/types'
import { preformatHumanResources } from '../utils/ventilator'
import { filterByCategoryAndFonction, getSituation } from '../utils/simulator'
import { copyArray } from '../utils/array'

/**
 * Route de la page réaffectateur
 */
export default class RouteReaffectator extends Route {
  /**
   * Constructeur
   */
  constructor (params) {
    super({ ...params, model: 'HumanResources' })
  }

  /**
   * Interface de résultat de la page réaffectator
   * @param {*} backupId
   * @param {*} date
   * @param {*} contentieuxIds
   * @param {*} categoryId
   * @param {*} fonctionsIds
   * @param {*} referentielList
   */
  @Route.Post({
    bodyType: Types.object().keys({
      backupId: Types.number().required(),
      date: Types.date().required(),
      contentieuxIds: Types.array(),
      categoryId: Types.number().required(),
      fonctionsIds: Types.array().required(),
      referentielList: Types.array(),
    }),
    accesses: [Access.canVewHR],
  })
  async filterList (ctx) {
    let { backupId, date, fonctionsIds, categoryId, referentielList } = this.body(ctx)
    if (!(await this.models.HRBackups.haveAccess(backupId, ctx.state.user.id))) {
      ctx.throw(401, "Vous n'avez pas accès à cette juridiction !")
    }

    console.time('step1')
    const hr = await this.model.getCache(backupId)
    console.timeEnd('step1')
    console.time('step3')
    let hrfiltered = filterByCategoryAndFonction(copyArray(hr), null, fonctionsIds)
    console.timeEnd('step3')
    console.time('step4')
    let categories = await this.models.HRCategories.getAll()
    const activities = await this.models.Activities.getAll(backupId, date)

    let referentiel = copyArray(await this.models.ContentieuxReferentiels.getReferentiels()).filter((r) => r.label !== 'Indisponibilité')
    for (let i = 0; i < referentiel.length; i++) {
      referentiel[i] = {
        ...referentiel[i],
        ...(await getSituation(referentiel[i].id, hrfiltered, activities, categories, date, null, categoryId)),
      }
    }
    console.timeEnd('step4')

    this.sendOk(ctx, {
      list: categories.map((category) => ({
        originalLabel: category.label,
        allHr: preformatHumanResources(filterByCategoryAndFonction(copyArray(hr), category.id, null), date, referentielList),
        categoryId: category.id,
        referentiel,
      })),
    })
  }
}
