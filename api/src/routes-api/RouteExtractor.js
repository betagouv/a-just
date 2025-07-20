import Route, { Access } from './Route'
import { Types } from '../utils/types'
import {
  autofitColumns,
  buildExcelRef,
  flatListOfContentieuxAndSousContentieux,
  formatFunctions,
  getJuridictionData,
  getViewModel,
  replaceIfZero,
  runExtractsInParallel,
} from '../utils/extractor'
import { getHumanRessourceList } from '../utils/humanServices'
import { cloneDeep, groupBy, last, orderBy, sumBy } from 'lodash'
import { isDateGreaterOrEqual, month, today } from '../utils/date'
import { EXECUTE_EXTRACTOR } from '../constants/log-codes'
import { updateLabels } from '../utils/referentiel'

import { calculateETPForContentieux, generateHRIndexes } from '../utils/human-resource'
import { getHRPositions } from '../utils/calculator'
import { loadOrWarmHR } from '../utils/redis'

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
    let hr = await loadOrWarmHR(backupId, this.models)
    console.timeEnd('extractor-3')
    //hr = hr.slice(0, 1) // A SUPPRIMER

    console.time('extractor-4')
    const categories = await this.models.HRCategories.getAll()
    const functionList = await this.models.HRFonctions.getAllFormatDdg()
    const formatedFunctions = await formatFunctions(functionList)
    const allHuman = await getHumanRessourceList(hr, undefined, undefined, undefined, today(dateStart), today(dateStop))
    console.timeEnd('extractor-4')

    console.time('🧩 Pré-formatage / Indexation')
    const indexes = await generateHRIndexes(allHuman)
    console.timeEnd('🧩 Pré-formatage / Indexation')

    console.time('extractor-5')
    let { onglet1, onglet2 } = await runExtractsInParallel({
      indexes,
      allHuman,
      flatReferentielsList,
      categories,
      categoryFilter,
      juridictionName,
      dateStart,
      dateStop,
      isJirs,
      old: false, // mettre une condition si supérioeur à 10 mois ou non
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
        await this.models.Activities.getByMonthNew(dateStart, elem.id)
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

    const list = await this.models.Activities.getByMonthNew(dateStart, backupId)

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
   * Test pour mise en place de cache optimisé
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
    let { backupId } = this.body(ctx)

    const categories = await this.models.HRCategories.getAll()
    console.time('onPreload')
    //await this.models.HumanResources.forceRecalculateAllHrCache()
    console.timeEnd('onPreload')

    console.time('Mise en cache')
    let hr = await loadOrWarmHR(backupId, this.models)
    console.timeEnd('Mise en cache')

    //hr = hr.slice(259, 260)
    hr = hr.filter((h) => [33592].includes(h.id))
    console.time('🧩 Pré-formatage / Indexation')
    const indexes = await generateHRIndexes(hr)
    console.timeEnd('🧩 Pré-formatage / Indexation')

    console.log(indexes.resultMap, 'length', hr.length)
    // 🔹 Requête ETP spécifique
    const query = {
      start: '2025-01-01T12:00:00.000Z', // Date de début de la période recherchée
      end: '2025-06-01T12:00:00.000Z', // Date de fin de la période recherchée
      category: undefined, // ID de la catégorie recherchée
      fonctions: undefined, // Liste des fonctions recherchées
      contentieux: 440, // ID du contentieux recherché
    }

    console.time('Get new query')
    const totalETPold = getHRPositions(models, hr, categories, query.contentieux, today(query.start), today(query.end))
    const totalETPnew = calculateETPForContentieux(indexes, query, categories)
    console.timeEnd('Get new query')

    console.log(totalETPold[0].totalEtp, totalETPnew[0].totalEtp, totalETPold[0].totalEtp - totalETPnew[0].totalEtp)
    const objResult = Object.fromEntries(indexes.categoryIndex)
    console.log(objResult)
    this.sendOk(ctx, { hr, totalETPnew, res: await loadOrWarmHR(211, this.models), objResult })
  }
}

/**
 * 

    const key = backupId
    const value = hr

    console.time('set cache')
    await setCacheValue(key, value, 'test')
    console.timeEnd('set cache')

    console.time('get cache')
    const result = await getCacheValue(key, 'test')
    console.timeEnd('get cache')

    //console.log(result)
    this.sendOk(ctx, { result })
 */
/**
    console.time('Get HRPosition')
    const etpAffected = getHRPositions({}, hr, categories, queryContentieux, today(queryStart), today(queryEnd))
    console.timeEnd('Get HRPosition')

    //console.log(totalETP, etpAffected)
    const objResult = Object.fromEntries(resultMap)
 */
