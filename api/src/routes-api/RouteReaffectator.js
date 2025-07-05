import Route, { Access } from './Route'
import { Types } from '../utils/types'
import { preformatHumanResources } from '../utils/ventilator'
import { filterByContentieuxWithIndex, filterByFonctionWithIndex, getSituation } from '../utils/simulator'
import { copyArray } from '../utils/array'
import { EXECUTE_REAFFECTATOR } from '../constants/log-codes'
import { canHaveUserCategoryAccess } from '../utils/hr-catagories'
import { HAS_ACCESS_TO_MAGISTRAT } from '../constants/access'
import { loadOrWarmHR } from '../utils/redis'
import { filterAgentsByDateCategoryFunction, generateHRIndexes } from '../utils/human-resource'

/**
 * Route de la page réaffectateur
 */
export default class RouteReaffectator extends Route {
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
  async filterList(ctx) {
    let { backupId, date, fonctionsIds, categoryId, referentielList, contentieuxIds } = this.body(ctx)
    if (!(await this.models.HRBackups.haveAccess(backupId, ctx.state.user.id))) {
      ctx.throw(401, "Vous n'avez pas accès à cette juridiction !")
    }

    let referentiel = copyArray(await this.models.ContentieuxReferentiels.getReferentiels(backupId)).filter((r) => r.label !== 'Indisponibilité')
    if (referentielList && referentielList.length == referentiel.length) {
      referentielList = null
    }

    if (
      !fonctionsIds &&
      !referentielList &&
      ((categoryId === 1 && canHaveUserCategoryAccess(ctx.state.user, HAS_ACCESS_TO_MAGISTRAT)) ||
        (categoryId !== 1 && !canHaveUserCategoryAccess(ctx.state.user, HAS_ACCESS_TO_MAGISTRAT)))
    ) {
      // memorize first execution by user
      await this.models.Logs.addLog(EXECUTE_REAFFECTATOR, ctx.state.user.id)
    }

    let categories = await this.models.HRCategories.getAll()
    const activities = await this.models.Activities.getAll(backupId)

    console.time('Mise en cache')
    let hr = await loadOrWarmHR(backupId, this.models)
    console.timeEnd('Mise en cache')

    console.time('🧩 Pré-formatage / Indexation')
    const preload = await generateHRIndexes(hr)
    console.timeEnd('🧩 Pré-formatage / Indexation')

    console.time('🧩 Filtre fonction')
    let hrfiltered = filterByFonctionWithIndex(copyArray(hr), fonctionsIds, preload.functionIndex, preload.periodsDatabase)
    console.timeEnd('🧩 Filtre fonction')

    console.time('🧩 Filtre contentieux')
    hrfiltered = filterByContentieuxWithIndex(hrfiltered, contentieuxIds, preload.contentieuxIndex)
    console.timeEnd('🧩 Filtre contentieux')

    console.time('🧩 Pré-formatage / Indexation')
    const indexes = await generateHRIndexes(hrfiltered)
    console.timeEnd('🧩 Pré-formatage / Indexation')

    console.time('🧮 Calculation')
    for (let i = 0; i < referentiel.length; i++) {
      referentiel[i] = {
        ...referentiel[i],
        ...(await getSituation(referentiel[i].id, hrfiltered, activities, categories, date, null, categoryId, null, indexes, true, true)),
      }
    }
    console.timeEnd('🧮 Calculation')

    console.time('Format by categories')
    const resultList = await Promise.all(
      categories.map(async (category) => {
        const filterFonctionsIds = category.id === categoryId ? fonctionsIds : null

        const filteredHr = preformatHumanResources(
          filterAgentsByDateCategoryFunction({
            hr,
            categoryId: category.id,
            fonctionsIds: filterFonctionsIds,
            date,
            indexes,
          }),
          date,
          referentielList,
          filterFonctionsIds,
        )

        return {
          originalLabel: category.label,
          allHr: filteredHr,
          categoryId: category.id,
          referentiel,
        }
      }),
    )
    console.timeEnd('Format by categories')

    this.sendOk(ctx, {
      list: resultList,
    })
  }
}
