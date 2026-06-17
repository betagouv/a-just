import Route, { Access } from './Route'
import { Types } from '../utils/types'
import { preformatHumanResources } from '../utils/ventilator'
import { filterByContentieuxWithIndex, filterByFonctionWithIndex, getSituation } from '../utils/simulator'
import { copyArray } from '../utils/array'
import { EXECUTE_REAFFECTATOR } from '../constants/log-codes'
import { canHaveUserCategoryAccess } from '../utils/hr-catagories'
import { HAS_ACCESS_TO_MAGISTRAT } from '../constants/access'
import { getObjectSizeInMB, loadOrWarmHR } from '../utils/redis'
import { filterAgentsByDateCategoryFunction, findAllSituations, findSituation, generateHRIndexes } from '../utils/human-resource'
import { orderBy } from 'lodash'
import { etpLabel } from '../constants/referentiel'
import zlib from 'zlib'
import { promisify } from 'util'

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

    console.time('Global reaffectator')
    let referentiel = copyArray(await this.models.ContentieuxReferentiels.getReferentiels(backupId, false, null, false, false)).filter(
      (r) => r.label !== 'Indisponibilité',
    )

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
    let hr = await loadOrWarmHR(backupId, this.models, ctx.state.user.id)
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
        ...(await getSituation({ parent: [referentiel[i].id], child: referentiel[i].childrens.map((c) => c.id) }, hrfiltered, activities, categories, date, null, categoryId, null, indexes, true, true)),
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

    console.time('last step')
    const allP = orderBy(
      hr.map((person) => {
        let situations = findAllSituations(person, this.date)
        if (situations.length === 0) {
          // if no situation in the past get to the future
          situations = findAllSituations(person, this.date, true, true)
        }
        const { currentSituation } = findSituation(person, this.date)
        let etp = (currentSituation && currentSituation.etp) || null
        if (etp < 0) {
          etp = 0
        }
        return {
          id: person.id,
          currentActivities: (currentSituation && currentSituation.activities) || [],
          lastName: person.lastName,
          firstName: person.firstName,
          isIn: false,
          dateStart: person.dateStart,
          dateEnd: person.dateEnd,
          situations: situations,
          etp,
          etpLabel: etp ? etpLabel(etp) : null,
          categoryName: situations.length && situations[0].category ? situations[0].category.label : '',
          category: situations.length && situations[0].category ? situations[0].category : null,
          categoryRank: situations.length && situations[0].category ? situations[0].category.rank : null,
          fonctionRank: situations.length && situations[0].fonction ? situations[0].fonction.rank : null,
          fonction: situations.length && situations[0].fonction ? situations[0].fonction : null,
          indisponibilities: person.indisponibilities,
          updatedAt: person.updatedAt,
        }
      }),
      ['categoryRank', 'fonctionRank', 'lastName'],
    )
    console.timeEnd('last step')

    const json = JSON.stringify({
      list: resultList,
      allPersons: allP,
    })

    console.timeEnd('Global reaffectator')
    const gzip = promisify(zlib.gzip)
    const compressed = await gzip(json)
    const rawSize = getObjectSizeInMB({
      list: resultList,
      allPersons: allP,
    })
    const compressedSize = (compressed.length / 1024 / 1024).toFixed(2)

    //console.log(`🔍 Taille HR brute : ${rawSize} Mo`)
    //console.log(`📦 Taille HR compressée : ${compressedSize} Mo`)

    this.sendOk(ctx, {
      list: resultList,
      allPersons: allP,
    })
  }
}
