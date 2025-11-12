import Route, { Access } from './Route'
import { Types } from '../utils/types'
import {
  autofitColumns,
  buildExcelRef,
  computeExtractor,
  createFlatReferentiel,
  flatListOfContentieuxAndSousContentieux,
  formatFunctions,
  generateOnglets,
  getJuridictionData,
  getViewModel,
  isHumanPresentOnInterval,
  replaceIfZero,
  runExtractsInParallel,
} from '../utils/extractor'
import { getHumanRessourceList } from '../utils/humanServices'
import { cloneDeep, groupBy, isNumber, last, orderBy, sumBy } from 'lodash'
import { isDateGreaterOrEqual, month, today } from '../utils/date'
import { EXECUTE_EXTRACTOR } from '../constants/log-codes'
import { buildIdToLabelMap, completePeriod, fillMissingContentieux, updateAndMerge, updateLabels } from '../utils/referentiel'
import { generateHRIndexes } from '../utils/human-resource'
import { loadOrWarmHR, printKeys } from '../utils/redis'
import { getJob } from '../utils/jobStore'
import { checkAbort, withAbortTimeout } from '../utils/abordTimeout'
import { CET_LABEL } from '../constants/referentiel'

/**
 * Route de la page extracteur
 */
export default class RouteExtractor extends Route {
  // model de BDD
  model

  constructor(params) {
    super(params)
    this.model = params.models.HumanResources
  }

  async respondJobStatus(ctx, jobId) {
    // Évite le cache
    ctx.set('Cache-Control', 'no-store')

    const job = await getJob(jobId)
    if (!job) return ctx.throw(404, 'Job introuvable')

    const userId = ctx.state?.user?.id
    if (!userId) return ctx.throw(401, 'Non authentifié')

    if (String(userId) !== String(job.userId)) {
      console.warn('[jobs] user mismatch', {
        jobId,
        userIdRuntime: userId,
        userIdJob: job.userId,
        types: { runtime: typeof userId, job: typeof job.userId },
      })
      return ctx.throw(403, 'Job non accessible')
    }

    if (job.status === 'done') {
      ctx.status = 200
      ctx.body = { status: 'done', result: job.result }
    } else if (job.status === 'error') {
      ctx.status = 500
      ctx.body = { status: 'error', error: job.error }
    } else {
      // queued | running
      ctx.status = 202
      ctx.body = { status: job.status, progress: job.progress, step: job.step }
    }
  }

  /**
   *
   * @param {*} ctx
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
        printKeys('*')

        if (!(await this.models.HRBackups.haveAccess(backupId, ctx.state.user.id))) {
          ctx.throw(401, "Vous n'avez pas accès à cette juridiction !")
        }

        await this.models.Logs.addLog(EXECUTE_EXTRACTOR, ctx.state.user.id, { type: 'effectif' })

        console.time('extractor-1')
        const juridictionName = await this.models.HRBackups.findById(backupId)
        const isJirs = await this.models.ContentieuxReferentiels.isJirs(backupId)
        const referentiels = await this.models.ContentieuxReferentiels.getReferentiels(backupId, true, undefined, false, true)
        console.timeEnd('extractor-1')

        console.time('extractor-2')
        const flatReferentielsList = await flatListOfContentieuxAndSousContentieux([...referentiels])
        console.timeEnd('extractor-2')

        console.time('extractor-3')
        let hr = await loadOrWarmHR(backupId, this.models)
        console.timeEnd('extractor-3')

        console.time('extractor-4')
        const categories = await this.models.HRCategories.getAll()
        const functionList = await this.models.HRFonctions.getAllFormatDdg()
        const formatedFunctions = await formatFunctions(functionList)
        const allHuman = await getHumanRessourceList(hr, undefined, undefined, undefined, today(dateStart), today(dateStop))
        console.timeEnd('extractor-4')

        console.time('🧩 Pré-formatage / Indexation')
        const indexes = await generateHRIndexes(allHuman)
        console.timeEnd('🧩 Pré-formatage / Indexation')
        console.log('SI')
        checkAbort(signal)
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
          old: true, // mettre une condition si supérioeur à 10 mois ou non,
          backupId,
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

  /**
   *
   * @param {*} ctx
   */
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
    await this.models.Logs.addLog(EXECUTE_EXTRACTOR, ctx.state.user.id, { type: 'activité' })

    const isJirs = await this.models.ContentieuxReferentiels.isJirs(backupId)
    const referentiels = await this.models.ContentieuxReferentiels.getReferentiels(backupId, isJirs, undefined, undefined)
    const flatReferentielsList = await flatListOfContentieuxAndSousContentieux([...referentiels])

    const list = await this.models.Activities.getByMonthNew(dateStart, backupId)
    const lastUpdate = await this.models.HistoriesActivitiesUpdate.getLastUpdate(list.map((i) => i.id))

    let activities = await this.models.Activities.getAllDetails(backupId)
    activities = activities.map((r) => ({ ...r, periode: today(r.periode) }))
    activities = orderBy(activities, 'periode', ['asc'])
      .filter((act) => isDateGreaterOrEqual(act.periode, month(dateStart, 0)) && isDateGreaterOrEqual(month(dateStop, 0, 'lastday'), act.periode))
      .map((x) => ({ periode: today(x.periode).setDate(1), ...x }))

    activities = updateLabels(activities, referentiels)

    let sum = cloneDeep(activities).map((x) => {
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

    sumTab = completePeriod(sumTab || [], flatReferentielsList || [], '', 0)

    let GroupedList = groupBy(activities, 'periode')
    GroupedList = fillMissingContentieux(GroupedList, flatReferentielsList)

    this.sendOk(ctx, { list: GroupedList, sumTab, lastUpdate })
  }

  /**
   * Nouvelle route pour démarrer le job (asynchrone) : répond 202 + jobId
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
  async startFilterList(ctx) {
    const { backupId, dateStart, dateStop, categoryFilter } = this.body(ctx)
    const userId = ctx.state?.user?.id
    if (!userId) return ctx.throw(401, 'Non authentifié')

    if (!(await this.models.HRBackups.haveAccess(backupId, userId))) {
      return ctx.throw(401, "Vous n'avez pas accès à cette juridiction !")
    }

    // Minimal fix: define a no-op progress callback to avoid ReferenceError
    const onProgress = () => {}
    const result = await computeExtractor(this.models, { backupId, dateStart, dateStop, categoryFilter, old: true }, onProgress)

    this.sendOk(ctx, result)
    /**
    // ✅ jobId depuis le jobStore Redis (async)
    const jobId = await createJob(userId, { backupId, dateStart, dateStop, categoryFilter })

    ;(async () => {
      try {
        await this.models.Logs.addLog(EXECUTE_EXTRACTOR, userId, { type: 'effectif' })

        // Progress callback asynchrone (fire-and-forget, ne bloque pas le calcul)
        const onProgress = (p, step) => setJobProgress(jobId, p, step)

        const result = await computeExtractor(this.models, { backupId, dateStart, dateStop, categoryFilter, old: true }, onProgress)

        // ✅ marque comme terminé
        await setJobResult(jobId, result)
      } catch (e) {
        // ✅ marque comme erreur
        await setJobError(jobId, e?.message || 'unknown')
      } finally {
        // ✅ purge des anciens jobs
        await cleanupOld()
      }
    })().catch((err) => {
      // sécurité : log si l’IIFE crashe
      console.error('Background job error:', err)
    })

    ctx.status = 202
    ctx.body = { jobId }
    */
  }

  @Route.Post({
    bodyType: Types.object().keys({
      jobId: Types.string().required(),
    }),
    accesses: [Access.canVewHR],
  })
  async statusFilterListPost(ctx) {
    const { jobId } = this.body(ctx)
    // si respondJobStatus est une méthode async de la classe :
    await this.respondJobStatus(ctx, jobId)
    // (sinon, remplace par la logique inline getJob/retours 200/202/500)
  }

  @Route.Post({
    bodyType: Types.object().keys({
      backupId: Types.number().required(),
      dateStart: Types.date().required(),
      dateStop: Types.date().required(),
      categoryFilter: Types.any().required(),
    }),
    accesses: [Access.canVewHR],
  })
  async filterListNew(ctx) {
    const { backupId, dateStart, dateStop, categoryFilter } = this.body(ctx)
    console.time('NEW PERF')

    // ------------------------- 1) INITIALISATION -------------------------
    let query = { start: new Date(dateStart), end: new Date(dateStop) }
    let logs = new Array()
    let hr = await loadOrWarmHR(backupId, this.models)
    hr = hr.filter((h) => h.id === 25373)
    hr = hr.filter((h) => isHumanPresentOnInterval(h, query))
    const indexes = await generateHRIndexes(hr, true)
    const referentiels = await this.models.ContentieuxReferentiels.getReferentiels(backupId, true, undefined, false, true)
    const CETId = await this.models.ContentieuxReferentiels.getContentieuxIdByLabel(CET_LABEL)
    const juridictionName = await this.models.HRBackups.findById(backupId)
    const isJirs = await this.models.ContentieuxReferentiels.isJirs(backupId)
    const { flatReferentiel, ctxL3, indispoL3 } = await createFlatReferentiel([...referentiels])
    const mapRefIdsToLabels = buildIdToLabelMap(flatReferentiel)

    let emptyFlatMapReferentiel = flatReferentiel.reduce((acc, item) => {
      acc.set(item.id, 0)
      return acc
    }, new Map())
    const periodsByDate = indexes.intervalTree.search(query.start, query.end) //Récuparations de tous les segments sur un interval

    // ------------------------- 2) CALCULS -------------------------
    const {
      onglet1: rawOnglet1,
      onglet2: rawOnglet2,
      ongletLogs,
    } = generateOnglets({
      hr,
      query,
      indexes,
      periodsByDate,
      emptyFlatMapReferentiel,
      mapRefIdsToLabels,
      ctxL3,
      indispoL3,
      CETId,
      flatReferentiel,
      isJirs,
      juridictionName,
      logs,
    })

    // ------------------------- 3) FORMATAGE -------------------------
    let onglet1 = orderBy(rawOnglet1, ['Catégorie', 'Nom', 'Prénom', 'Matricule'], ['desc', 'asc', 'asc', 'asc'])
    let onglet2 = orderBy(rawOnglet2, ['Catégorie', 'Nom', 'Prénom', 'Matricule'], ['desc', 'asc', 'asc', 'asc'])

    onglet1 = onglet1.filter((x) => x['Catégorie'] == null || categoryFilter.includes(String(x['Catégorie']).toLowerCase()))
    onglet2 = onglet2.filter((x) => x['Catégorie'] == null || categoryFilter.includes(String(x['Catégorie']).toLowerCase()))

    const flatReferentielsList = await flatListOfContentieuxAndSousContentieux([...referentiels])
    const functionList = await this.models.HRFonctions.getAllFormatDdg()
    const formatedFunctions = await formatFunctions(functionList)
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
      ongletLogs,
    })

    console.timeEnd('NEW PERF')

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
}
