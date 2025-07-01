import Route, { Access } from './Route'
import { Types } from '../utils/types'
import { preformatHumanResources } from '../utils/ventilator'
import { buildPeriodsByAgent, filterByCategoryAndFonction, filterByFonctionWithIndex, getHRPositionsOptimised, getSituation } from '../utils/simulator'
import { copyArray } from '../utils/array'
import { EXECUTE_REAFFECTATOR } from '../constants/log-codes'
import { canHaveUserCategoryAccess } from '../utils/hr-catagories'
import { HAS_ACCESS_TO_MAGISTRAT } from '../constants/access'
import { checkAbort, makeAbortableMethod, withAbortTimeout } from '../utils/abordTimeout'
import { loadOrWarmHR } from '../utils/redis'
import {
  filterAgentsByDateCategoryFunction,
  filterAgentsWithIndexes,
  filterHrWithIndexes,
  generateAndIndexAllStableHRPeriods,
  generateHRIndexes,
} from '../utils/human-resource'
import deepEqual from 'fast-deep-equal'
import fs from 'node:fs'
import { cloneDeep, orderBy } from 'lodash'
import { today } from '../utils/date'
import { compareResults } from '../utils/utils'
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
  async filterListNew(ctx) {
    let { backupId, date, fonctionsIds, categoryId, referentielList } = this.body(ctx)
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
    const indexes = await generateHRIndexes(hr)
    console.timeEnd('🧩 Pré-formatage / Indexation')

    console.time('🧩 NEW')
    let hrfiltered = filterByCategoryAndFonction(copyArray(hr), null, fonctionsIds)
    console.timeEnd('🧩 NEW')

    for (let i = 0; i < referentiel.length; i++) {
      referentiel[i] = {
        ...referentiel[i],
        ...(await getSituation(referentiel[i].id, hrfiltered, activities, categories, date, null, categoryId)),
      }
    }

    console.time('OLD')

    /** OLD */
    const resultListOld = await Promise.all(
      categories.map(async (category) => {
        const filterFonctionsIds = category.id === categoryId ? fonctionsIds : null
        let allHr = preformatHumanResources(
          filterByCategoryAndFonction(copyArray(hr), category.id, filterFonctionsIds, date),
          date,
          referentielList,
          filterFonctionsIds,
        )

        return {
          originalLabel: category.label,
          allHr: allHr.filter((h) => h.category && h.category.id === category.id), // force to filter by actual category
          categoryId: category.id,
          referentiel,
        }
      }),
    )
    console.timeEnd('OLD')
    console.log('request date => ', date)

    console.time('🧩 OL')
    let hrfilteredNew = filterByFonctionWithIndex(copyArray(hr), fonctionsIds, indexes.functionIndex)
    console.timeEnd('🧩 OL')

    console.time('NEW')
    /** NEW */
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
    console.timeEnd('NEW')

    /**console.log(oldResult.length, newResult.length)
    const idsA = new Set(resultList[1].allHr.map((x) => x.id))
    const diffIds = resultListOld[1].allHr.filter((x) => !idsA.has(x.id)).map((x) => x.id)
    console.log('DIF', diffIds)*/

    //resultListOld[1].allHr = orderBy(resultListOld[1].allHr, 'id', ['asc'])

    //resultList[1].allHr = orderBy(resultList[1].allHr, 'id', ['asc'])
    const oldResult = hrfiltered //resultListOld[1].allHr
    const newResult = hrfilteredNew //resultList[1].allHr

    let allEqual = true
    let differences = []

    if (oldResult.length !== newResult.length) {
      console.error(`❌ Nombre d'éléments différents : ${oldResult.length} vs ${newResult.length}`)
      allEqual = false
    }

    for (let i = 0; i < Math.min(oldResult.length, newResult.length); i++) {
      const oldItem = oldResult[i]
      const newItem = newResult[i]

      if (!deepEqual(oldItem, newItem)) {
        allEqual = false
        differences.push({
          index: i,
          id: oldItem['Réf.'] || newItem['Réf.'],
          old: oldItem,
          new: newItem,
        })
      }
    }

    if (!allEqual) {
      console.error(`❌ ${differences.length} différences trouvées !`)
      fs.writeFileSync('./computeExtract-differences.json', JSON.stringify(differences, null, 2), 'utf-8')
      throw new Error('Non-régression échouée ! Différences enregistrées dans computeExtract-differences.json')
    }

    console.log('✅ Test de non-régression réussi. Les deux versions donnent des résultats identiques.')

    this.sendOk(ctx, {
      list: resultList,
    })
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
    let { backupId, date, fonctionsIds, categoryId, referentielList } = this.body(ctx)
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
    const indexes = await generateHRIndexes(hr)
    const { resultMap, periodsDatabase, agentIndex } = await generateAndIndexAllStableHRPeriods(hr)
    console.timeEnd('🧩 Pré-formatage / Indexation')

    console.time('🧩 OL')
    let hrfiltered = filterByFonctionWithIndex(copyArray(hr), fonctionsIds, indexes.functionIndex)
    console.timeEnd('🧩 OL')

    const newReferentiel = cloneDeep(referentiel)

    console.time('getSitu')
    for (let i = 0; i < referentiel.length; i++) {
      referentiel[i] = {
        ...referentiel[i],
        ...(await getSituation(referentiel[i].id, hrfiltered, activities, categories, date, null, categoryId)),
      }
    }
    console.timeEnd('getSitu')

    console.time('getSitu Opti')
    const periodsList = Array.from(periodsDatabase.values())
    const periodsByAgent = buildPeriodsByAgent(periodsList)

    for (let i = 0; i < newReferentiel.length; i++) {
      const ref = newReferentiel[i]

      // Application de la nouvelle fonction optimisée pour ce referentiel.id
      const hrPositions = getHRPositionsOptimised(
        periodsByAgent,
        [ref.id], // Si referentielId est un tableau, tu peux aussi passer directement ref.id si besoin
        categories,
        date,
      )

      newReferentiel[i] = {
        ...ref,
        ...{ hrPositions },
      }
    }

    console.timeEnd('getSitu Opti')

    compareResults(referentiel, newReferentiel)

    console.time('format by categories')
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
    console.timeEnd('format by categories')

    this.sendOk(ctx, {
      list: resultList,
    })
  }
}

//date = today(new Date(today(date) - 86400000))
