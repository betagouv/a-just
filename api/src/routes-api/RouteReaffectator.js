import Route, { Access } from './Route'
import { Types } from '../utils/types'
import { preformatHumanResources } from '../utils/ventilator'
import { filterByCategoryAndFonction, getSituation } from '../utils/simulator'
import { copyArray } from '../utils/array'
import { EXECUTE_REAFFECTATOR } from '../constants/log-codes'
import { canHaveUserCategoryAccess } from '../utils/hr-catagories'
import { HAS_ACCESS_TO_MAGISTRAT } from '../constants/access'
import { checkAbort, makeAbortableMethod, withAbortTimeout } from '../utils/abordTimeout'
import { orderBy } from 'lodash'
import { findAllSituations, findSituation } from '../utils/human-resource'
import { etpLabel } from '../constants/referentiel'

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
    try {
      await withAbortTimeout(async (signal) => {
        let { backupId, date, fonctionsIds, categoryId, referentielList } = this.body(ctx)
        if (!(await this.models.HRBackups.haveAccess(backupId, ctx.state.user.id))) {
          ctx.throw(401, "Vous n'avez pas accès à cette juridiction !")
        }
        let referentiel = copyArray(await this.models.ContentieuxReferentiels.getReferentiels(backupId)).filter((r) => r.label !== 'Indisponibilité')
        if (referentielList && referentielList.length == referentiel.length) {
          referentielList = null
        }

        checkAbort(signal)

        if (
          !fonctionsIds &&
          !referentielList &&
          ((categoryId === 1 && canHaveUserCategoryAccess(ctx.state.user, HAS_ACCESS_TO_MAGISTRAT)) ||
            (categoryId !== 1 && !canHaveUserCategoryAccess(ctx.state.user, HAS_ACCESS_TO_MAGISTRAT)))
        ) {
          // memorize first execution by user
          await this.models.Logs.addLog(EXECUTE_REAFFECTATOR, ctx.state.user.id)
        }

        const getCacheAbortable = makeAbortableMethod(this.model.getCache, signal)
        const hr = await getCacheAbortable(backupId, false, signal)
        //const hr = await this.model.getCache(backupId)

        checkAbort(signal)
        let hrfiltered = filterByCategoryAndFonction(copyArray(hr), null, fonctionsIds)
        let categories = await this.models.HRCategories.getAll()
        const activities = await this.models.Activities.getAll(backupId)

        for (let i = 0; i < referentiel.length; i++) {
          checkAbort(signal)
          referentiel[i] = {
            ...referentiel[i],
            ...(await getSituation(referentiel[i].id, hrfiltered, activities, categories, date, null, categoryId, signal)),
          }
        }

        checkAbort(signal)

        const resultList = await Promise.all(
          categories.map(async (category) => {
            checkAbort(signal)
            const filterFonctionsIds = category.id === categoryId ? fonctionsIds : null
            let allHr = preformatHumanResources(
              filterByCategoryAndFonction(copyArray(hr), category.id, filterFonctionsIds, date),
              date,
              referentielList,
              filterFonctionsIds,
              signal,
            )

            return {
              originalLabel: category.label,
              allHr: allHr.filter((h) => h.category && h.category.id === category.id), // force to filter by actual category
              categoryId: category.id,
              referentiel,
            }
          }),
        )

        this.sendOk(ctx, {
          list: resultList,
          allPersons: orderBy(
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
          ),
        })
      }, 60000) // timeout en ms
    } catch (err) {
      console.error('❌ Traitement interrompu :', err.message)
      ctx.status = 503
      ctx.body = { error: err.message }
    }
  }
}
