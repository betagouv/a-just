import Route, { Access } from './Route'
import { Types } from '../utils/types'
import {
  autofitColumns,
  buildExcelRef,
  computeExtract,
  computeExtractDdg,
  flatListOfContentieuxAndSousContentieux,
  formatFunctions,
  getExcelLabel,
  getJuridictionData,
  getViewModel,
  replaceIfZero,
  runExtractsInParallel,
} from '../utils/extractor'
import { getHumanRessourceList } from '../utils/humanServices'
import { cloneDeep, groupBy, last, orderBy, sumBy } from 'lodash'
import { isDateGreaterOrEqual, month, today } from '../utils/date'
import { ABSENTEISME_LABELS } from '../constants/referentiel'
import { EXECUTE_EXTRACTOR } from '../constants/log-codes'
import { updateLabels } from '../utils/referentiel'
import { withAbortTimeout } from '../utils/abordTimeout'
import deepEqual from 'fast-deep-equal'
import fs from 'node:fs'
import { diff } from 'deep-diff'
import {
  buildIndexes,
  createDateIntervalIndex,
  formatHRData,
  generateAllStableHRPeriods,
  generateStableHRPeriods,
  generateStableHRPeriodsOptimized,
  generateStableHRPeriodsWithIndex,
  generateStablePeriods,
  getHRPositionsOptimized,
  logIndex,
  queryPeriodsByDateRange,
  searchPeriods,
} from '../utils/human-resource'
import { getHRPositions } from '../utils/calculator'

/**
 * Route de la page extrateur
 */

export default class RouteExtractor extends Route {
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
   * Interface de retour des calculs pour la page extracteur
   * @param {*} backupId
   * @param {*} dateStart
   * @param {*} dateStop
   * @param {*} categoryFilter
   */
  @Route.Post({
    bodyType: Types.object().keys({
      backupId: Types.number().required(),
      dateStart: Types.date().required(),
      dateStop: Types.date().required(),
      categoryFilter: Types.any().required(),
    }),
    accesses: [Access.canVewHR],
  })
  async filterList(ctx) {
    try {
      await withAbortTimeout(async (signal) => {
        const { backupId, dateStart, dateStop, categoryFilter } = this.body(ctx)

        if (!(await this.models.HRBackups.haveAccess(backupId, ctx.state.user.id))) {
          ctx.throw(401, "Vous n'avez pas accès à cette juridiction !")
        }

        await this.models.Logs.addLog(EXECUTE_EXTRACTOR, ctx.state.user.id, {
          type: 'effectif',
        })

        console.time('extractor-1')
        const juridictionName = await this.models.HRBackups.findById(backupId)
        const isJirs = await this.models.ContentieuxReferentiels.isJirs(backupId)
        const referentiels = await this.models.ContentieuxReferentiels.getReferentiels(backupId, undefined, undefined, true)
        console.timeEnd('extractor-1')

        console.time('extractor-2')
        const flatReferentielsList = await flatListOfContentieuxAndSousContentieux([...referentiels])
        console.timeEnd('extractor-2')

        console.time('extractor-3')
        const hr = await this.model.getCache(backupId)
        console.timeEnd('extractor-3')

        console.time('extractor-4')
        const categories = await this.models.HRCategories.getAll()
        const functionList = await this.models.HRFonctions.getAllFormatDdg()
        const formatedFunctions = await formatFunctions(functionList)
        const allHuman = await getHumanRessourceList(hr, undefined, undefined, undefined, dateStart, dateStop)
        console.timeEnd('extractor-4')

        console.time('extractor-5')
        let { onglet1, onglet2 } = await runExtractsInParallel({
          models: this.models,
          allHuman,
          flatReferentielsList,
          categories,
          categoryFilter,
          juridictionName,
          dateStart,
          dateStop,
          isJirs,
          signal,
        })
        console.timeEnd('extractor-5')

        console.time('extractor-6')
        const excelRef = buildExcelRef(flatReferentielsList)
        const { tproxs, allJuridiction } = await getJuridictionData(this.models, juridictionName)

        const onglet1Data = {
          values: onglet1,
          columnSize: await autofitColumns(onglet1, true),
        }

        const onglet2Data = {
          values: onglet2,
          columnSize: await autofitColumns(onglet2, true, 13),
          excelRef,
        }

        const viewModel = await getViewModel({
          referentiels,
          tproxs,
          onglet1: onglet1Data,
          onglet2: onglet2Data,
          allJuridiction,
        })
        console.timeEnd('extractor-6')

        this.sendOk(ctx, {
          fonctions: formatedFunctions,
          referentiels,
          tproxs,
          onglet1: onglet1Data,
          onglet2: onglet2Data,
          allJuridiction,
          viewModel,
        })
      }, 60000) // timeout en ms
    } catch (err) {
      console.error('❌ Traitement interrompu :', err.message)
      ctx.status = 503
      ctx.body = { error: err.message }
    }
  }

  /**
   *
   * @param {*} dateStart
   * @param {*} dateStop
   *
   */
  @Route.Post({
    bodyType: Types.object().keys({
      dateStart: Types.date().required(),
      dateStop: Types.date().required(),
    }),
    accesses: [Access.canVewHR],
  })
  async juridictionAjustedDataList(ctx) {
    let { dateStart /*, dateStop */ } = this.body(ctx)
    let result = []

    await this.models.HRBackups.getAll().then(async (res) => {
      res.map(async (elem) => {
        await this.models.Activities.getByMonth(dateStart, elem.id)
          .then((res) => {
            if (res.length) {
              for (let i = 0; i < res.length; i++) {
                if (res[i].entrees !== null || res[i].sorties !== null || res[i].stock !== null) {
                  result.push({ label: elem.label, id: res[0].backupId })
                  break
                }
              }
            }
          })
          .catch((err) => console.log('error: ', err))
      })
    })
  }

  @Route.Post({
    bodyType: Types.object().keys({
      backupId: Types.number().required(),
      dateStart: Types.date().required(),
      dateStop: Types.date().required(),
    }),
    accesses: [Access.canVewHR],
  })
  async filterListAct(ctx) {
    let { backupId, dateStart, dateStop } = this.body(ctx)

    if (!Access.isAdmin(ctx)) {
      if (!(await this.models.HRBackups.haveAccess(backupId, ctx.state.user.id))) {
        ctx.throw(401, "Vous n'avez pas accès à cette juridiction !")
      }
    }
    await this.models.Logs.addLog(EXECUTE_EXTRACTOR, ctx.state.user.id, {
      type: 'activité',
    })

    const isJirs = await this.models.ContentieuxReferentiels.isJirs(backupId)

    const referentiels = await this.models.ContentieuxReferentiels.getReferentiels(backupId, isJirs, undefined, undefined)

    const list = await this.models.Activities.getByMonth(dateStart, backupId)

    const lastUpdate = await this.models.HistoriesActivitiesUpdate.getLastUpdate(list.map((i) => i.id))

    let activities = await this.models.Activities.getAllDetails(backupId)
    activities = orderBy(activities, 'periode', ['asc'])
      .filter((act) => isDateGreaterOrEqual(act.periode, month(dateStart, 0)) && isDateGreaterOrEqual(month(dateStop, 0, 'lastday'), act.periode))
      .map((x) => {
        return {
          periode: today(x.periode).setDate(1),
          ...x,
        }
      })

    activities = updateLabels(activities, referentiels)

    //activities.map(x=>console.log(x.contentieux))
    referentiels.map((x) => console.log(x))
    let sum = cloneDeep(activities)

    sum = sum.map((x) => {
      const ajustedIn = x.entrees === 0 ? x.entrees : x.entrees || x.originalEntrees
      const ajustedOut = x.sorties === 0 ? x.sorties : x.sorties || x.originalSorties
      const ajustedStock = x.stock === 0 ? x.stock : x.stock || x.originalStock

      return { ajustedIn, ajustedOut, ajustedStock, ...x }
    })

    sum = groupBy(sum, 'contentieux.id')

    let sumTab = []

    Object.keys(sum).map((key) => {
      sumTab.push({
        periode: replaceIfZero(last(sum[key]).periode),
        entrees: sumBy(sum[key], 'ajustedIn'),
        sorties: sumBy(sum[key], 'ajustedOut'),
        stock: last(sum[key]).ajustedStock,
        originalEntrees: sumBy(sum[key], 'originalEntrees'),
        originalSorties: sumBy(sum[key], 'originalSorties'),
        originalStock: last(sum[key]).originalStock,
        idReferentiel: last(sum[key]).idReferentiel,
        contentieux: {
          code_import: last(sum[key]).contentieux.code_import,
          label: last(sum[key]).contentieux.label,
        },
      })
    })

    /** 
    const flatReferentiels = await flatListOfContentieuxAndSousContentieux([
      ...referentiels,
    ]);
    const labels = flatReferentiels.map(item => item.label);

    sumTab = sumTab.filter((x) => x.contentieux.code_import !== null && (labels.includes( x.contentieux.label)||labels.includes('Total '+x.contentieux.label)));


    GroupedList =  Object.keys(GroupedList).map((l) => {
      return GroupedList[l].filter((x) => x.contentieux.code_import !== null && (labels.includes( x.contentieux.label)||labels.includes('Total '+x.contentieux.label)));
    });
        */

    let GroupedList = groupBy(activities, 'periode')

    console.log(isJirs)
    //console.log(labels)
    this.sendOk(ctx, {
      list: GroupedList,
      sumTab,
      lastUpdate,
    })
  }

  /**
   * Interface de retour des calculs pour la page extracteur
   * @param {*} backupId
   * @param {*} dateStart
   * @param {*} dateStop
   * @param {*} categoryFilter
   */
  @Route.Post({
    bodyType: Types.object().keys({
      backupId: Types.number().required(),
      newVersion: Types.boolean(),
      regressionTest: Types.boolean(),
    }),
    accesses: [Access.canVewHR],
  })
  async getCache(ctx) {
    let { backupId, newVersion, regressionTest } = this.body(ctx)

    const categories = await this.models.HRCategories.getAll()

    let hr = await this.model.getCacheNew(backupId, true)

    hr = hr.filter((h) => h.id === 2417)

    console.time('Pré format')
    let result = await generateAllStableHRPeriods(hr)
    console.timeEnd('Pré format')

    // Appel de la fonction pour créer l'index
    console.time('CREATE INDEX')
    const indexMap = createDateIntervalIndex(result)
    console.timeEnd('CREATE format')

    console.time('Request 1 year')
    // Requête pour trouver toutes les périodes dans la plage du 1er janvier 2022 au 1er mars 2022
    const queryStart = '2024-03-03T12:00:00.000Z'
    const queryEnd = '2024-03-28T12:00:00.000Z'
    const periodsInRange = searchPeriods(indexMap, queryStart, queryEnd)
    console.timeEnd('Request 1 year')

    //const objResult = Object.fromEntries(result)

    this.sendOk(ctx, { hr, periodsInRange })
  }
}

//console.log(JSON.stringify(objResult, null, 2))

/**
    hr = hr.filter((h) => ![31537, 36992, 37002].includes(h.id))

    // Initialisation (1 fois)
    const indexes = buildIndexes(hr)

    const dateStart = new Date('2024-01-01')
    const dateStop = new Date('2024-12-31')

    // Requêtage ultra-rapide
    const results = getHRPositionsOptimized(indexes, 460, dateStart, dateStop)

    const results2 = getHRPositions(this.models, hr, categories, 460, dateStart, dateStop)

    console.log(results[0], results2[0])
    */
/**
    console.time('WITH INDEX')
    let result1 = generateStableHRPeriodsOptimized(hr[0])
    console.timeEnd('WITH INDEX')

    const oldResult = result
    const newResult = result1
    console.log('len', oldResult.length, newResult.length)

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
    console.timeEnd('non-regression-test')
 */
