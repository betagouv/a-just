import Route, { Access } from './Route'
import { Types } from '../utils/types'
import { preformatHumanResources } from '../utils/ventilator'
import { filterByCategoryAndFonction, getSituation } from '../utils/simulator'
import { copyArray } from '../utils/array'
import { EXECUTE_REAFFECTATOR } from '../constants/log-codes'

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
      fonctionsIds: Types.any(),
      referentielList: Types.array(),
    }),
    accesses: [Access.canVewHR],
  })
  async filterList (ctx) {
    let { backupId, date, fonctionsIds, categoryId, referentielList } = this.body(ctx)
    if (!(await this.models.HRBackups.haveAccess(backupId, ctx.state.user.id))) {
      ctx.throw(401, "Vous n'avez pas accès à cette juridiction !")
    }
    let referentiel = copyArray(await this.models.ContentieuxReferentiels.getReferentiels()).filter((r) => r.label !== 'Indisponibilité')
    if (referentielList && referentielList.length == referentiel.length) {
      referentielList = null
    }

    if (categoryId === 1 && !fonctionsIds && !referentielList) {
      // memorize first execution by user
      await this.models.Logs.addLog(EXECUTE_REAFFECTATOR, ctx.state.user.id)
    }

    const hr = await this.model.getCache(backupId)
    let hrfiltered = filterByCategoryAndFonction(copyArray(hr), null, fonctionsIds)
    let categories = await this.models.HRCategories.getAll()
    const activities = await this.models.Activities.getAll(backupId, date)

    for (let i = 0; i < referentiel.length; i++) {
      referentiel[i] = {
        ...referentiel[i],
        ...(await getSituation(referentiel[i].id, hrfiltered, activities, categories, date, null, categoryId)),
      }
    }

    this.sendOk(ctx, {
      list: categories.map((category) => {
        const filterFonctionsIds = category.id === categoryId ? fonctionsIds : null
        let allHr = preformatHumanResources(
          filterByCategoryAndFonction(copyArray(hr), category.id, filterFonctionsIds, date),
          date,
          referentielList,
          filterFonctionsIds
        )

        return {
          originalLabel: category.label,
          allHr: allHr.filter(h => h.category.id === category.id), // force to filter by actual category
          categoryId: category.id,
          referentiel,
        }
      }),
    })
  }
}
