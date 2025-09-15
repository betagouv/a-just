import Route, { Access } from './Route'
import { Types } from '../utils/types'
import {
  autofitColumns,
  buildExcelRef,
  computeExtractor,
  flatListOfContentieuxAndSousContentieux,
  formatFunctions,
  getJuridictionData,
  getViewModel,
  replaceIfZero,
  runExtractsInParallel,
} from '../utils/extractor'
import { getHumanRessourceList } from '../utils/humanServices'
import { cloneDeep, groupBy, last, orderBy, sumBy } from 'lodash'
import { getWorkingDaysCount, isDateGreaterOrEqual, month, today } from '../utils/date'
import { EXECUTE_EXTRACTOR } from '../constants/log-codes'
import { completePeriod, fillMissingContentieux, updateAndMerge, updateLabels } from '../utils/referentiel'
import { calculateETPForContentieux, generateHRIndexes } from '../utils/human-resource'
import { getHRPositions } from '../utils/calculator'
import { loadOrWarmHR } from '../utils/redis'
import { createJob, getJob, setJobProgress, setJobResult, setJobError, cleanupOld } from '../utils/jobStore'

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

  // Handler commun pour retourner l'état d'un job (réutilisé par la route POST /status)
  async respondJobStatus(ctx, jobId) {
    ctx.set('Cache-Control', 'no-store')
    const job = getJob(jobId)

    if (!job) return ctx.throw(404, 'Job introuvable')

    // sécurité : le job doit appartenir à l’utilisateur courant
    const userId = ctx.state?.user?.id
    if (!userId || userId !== job.userId) return ctx.throw(403, 'Job non accessible')

    if (job.status === 'done') {
      ctx.status = 200
      ctx.body = { status: 'done', result: job.result }
    } else if (job.status === 'error') {
      ctx.status = 500
      ctx.body = { status: 'error', error: job.error }
    } else {
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
    const { backupId, dateStart, dateStop, categoryFilter } = this.body(ctx)

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

    console.log(dateStart, dateStop, getWorkingDaysCount(dateStart, dateStop))
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

    const jobId = createJob(userId, { backupId, dateStart, dateStop, categoryFilter })

    ;(async () => {
      try {
        await this.models.Logs.addLog(EXECUTE_EXTRACTOR, userId, { type: 'effectif' })
        const result = await computeExtractor(this.models, { backupId, dateStart, dateStop, categoryFilter, old: true }, (p, step) =>
          setJobProgress(jobId, p, step),
        )
        setJobResult(jobId, result)
      } catch (e) {
        setJobError(jobId, e?.message || 'unknown')
      } finally {
        cleanupOld()
      }
    })()

    ctx.status = 202
    ctx.body = { jobId }
  }

  @Route.Post({
    bodyType: Types.object().keys({
      jobId: Types.string().required(),
    }),
    accesses: [Access.canVewHR],
  })
  async statusFilterListPost(ctx) {
    const { jobId } = this.body(ctx)
    await this.respondJobStatus(ctx, jobId)
  }
}
