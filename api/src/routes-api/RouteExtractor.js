import Route, { Access } from './Route'
import { Types } from '../utils/types'
import {
  autofitColumns,
  computeExtract,
  computeExtractDdg,
  flatListOfContentieuxAndSousContentieux,
  formatFunctions,
  getExcelLabel,
  getViewModel,
  replaceIfZero,
  sortByCatAndFct,
} from '../utils/extractor'
import { getHumanRessourceList } from '../utils/humanServices'
import { cloneDeep, groupBy, last, orderBy, sumBy } from 'lodash'
import { month } from '../utils/date'
import { ABSENTEISME_LABELS } from '../constants/referentiel'
import { EXECUTE_EXTRACTOR } from '../constants/log-codes'

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
  constructor (params) {
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
  async filterList (ctx) {
    let { backupId, dateStart, dateStop, categoryFilter } = this.body(ctx)
    if (!(await this.models.HRBackups.haveAccess(backupId, ctx.state.user.id))) {
      ctx.throw(401, "Vous n'avez pas accès à cette juridiction !")
    }

    await this.models.Logs.addLog(EXECUTE_EXTRACTOR, ctx.state.user.id, { type: 'effectif' })

    const juridictionName = await this.models.HRBackups.findById(backupId)

    console.time('extractor-1')
    const referentiels = await this.models.ContentieuxReferentiels.getReferentiels(backupId)
    console.timeEnd('extractor-1')

    console.time('extractor-2')
    const flatReferentielsList = await flatListOfContentieuxAndSousContentieux([...referentiels])
    console.timeEnd('extractor-2')

    console.time('extractor-3')
    const hr = await this.model.getCache(backupId)
    console.timeEnd('extractor-3')

    console.time('extractor-4')
    const categories = await this.models.HRCategories.getAll()
    console.timeEnd('extractor-4')

    console.time('extractor-4.1')
    const functionList = await this.models.HRFonctions.getAllFormatDdg()
    const formatedFunctions = formatFunctions(functionList)
    console.timeEnd('extractor-4;1')
    console.log(formatedFunctions)
    
    console.time('extractor-5')
    let allHuman = await getHumanRessourceList(hr, undefined, undefined, dateStart, dateStop)
    console.timeEnd('extractor-5')

    console.time('extractor-6')
    let onglet1 = await computeExtract(this.models, cloneDeep(allHuman), flatReferentielsList, categories, categoryFilter, juridictionName, dateStart, dateStop)
    console.timeEnd('extractor-6')

    const absenteismeList = []

    console.time('extractor-6.1')
    const formatedExcelList = flatReferentielsList
      .filter((elem) => {
        if (ABSENTEISME_LABELS.includes(elem.label) === false) return true
        else {
          absenteismeList.push(elem)
          return false
        }
      })
      .map((x) => {
        return x.childrens !== undefined ? { global: getExcelLabel(x, true), sub: null } : { global: null, sub: getExcelLabel(x, false) }
      })
    console.timeEnd('extractor-6.1')

    console.time('extractor-6.2')
    const excelRef = [
      { global: null, sub: 'ETPT sur la période hors indisponibilités' },
      { global: null, sub: 'Temps ventilés sur la période' },
      ...formatedExcelList,
      { global: null, sub: 'CET > 30 jours' },
      { global: 'Absentéisme réintégré (CMO + Congé maternité + CET < 30 jours)', sub: null },
      { global: null, sub: 'CET < 30 jours' },
      ...absenteismeList.map((y) => {
        return { global: null, sub: getExcelLabel(y, false) }
      }),
    ]
    console.timeEnd('extractor-6.2')

    console.time('extractor-7')
    let onglet2 = await computeExtractDdg(
      this.models,
      cloneDeep(allHuman),
      flatReferentielsList,
      categories,
      categoryFilter,
      juridictionName,
      dateStart,
      dateStop
    )
    console.timeEnd('extractor-7')

    console.time('extractor-8')
    //await onglet1.sort((a, b) => sortByCatAndFct(a, b))
    //await onglet2.sort((a, b) => sortByCatAndFct(a, b))
    onglet1 =orderBy(onglet1, ['Catégorie','Nom','Prénom','Matricule'],['desc','asc','asc','asc'])
    onglet2 =orderBy(onglet2, ['Catégorie','Nom','Prénom','Matricule'],['desc','asc','asc','asc'])
    const columnSize1 = await autofitColumns(onglet1, true)
    const columnSize2 = await autofitColumns(onglet2, true, 13)
    console.timeEnd('extractor-8')

    const label = (juridictionName.label || '').toUpperCase()
    let tproxs = (await this.models.TJ.getByTj(label, {}, { type: 'TPRX' })).map((t) => ({ id: t.id, tj: t.tj, tprox: t.tprox }))
    if (tproxs.length === 0) {
      tproxs = [{ id: 0, tj: label, tprox: label }]
    }

    if (onglet1 === null || onglet1 === undefined) onglet1 = []
    if (onglet2 === null || onglet2 === undefined) onglet2 = []

    let allJuridiction = (await this.models.TJ.getByTj(label, {}, {})).map((t) => ({ id: t.id, tj: t.tj, tprox: t.tprox, type: t.type }))

    let viewModel = await getViewModel({
      referentiels,
      tproxs,
      onglet1: { values: onglet1, columnSize: columnSize1 },
      onglet2: { values: onglet2, columnSize: columnSize2, excelRef },
      allJuridiction,
    })

    this.sendOk(ctx, {
      referentiels,
      tproxs,
      onglet1: { values: onglet1, columnSize: columnSize1 },
      onglet2: { values: onglet2, columnSize: columnSize2, excelRef },
      allJuridiction,
      viewModel,
      fonctions:formatedFunctions
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
  async juridictionAjustedDataList (ctx) {
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
  async filterListAct (ctx) {
    let { backupId, dateStart, dateStop } = this.body(ctx)

    if (!Access.isAdmin(ctx)) {
      if (!(await this.models.HRBackups.haveAccess(backupId, ctx.state.user.id))) {
        ctx.throw(401, "Vous n'avez pas accès à cette juridiction !")
      }
    }

    await this.models.Logs.addLog(EXECUTE_EXTRACTOR, ctx.state.user.id, { type: 'activité' })

    const list = await this.models.Activities.getByMonth(dateStart, backupId)

    const lastUpdate = await this.models.HistoriesActivitiesUpdate.getLastUpdate(list.map((i) => i.id))

    let activities = await this.models.Activities.getAllDetails(backupId)
    activities = orderBy(activities, 'periode', ['asc'])
      .filter((act) => act.periode >= month(dateStart, 0) && act.periode <= dateStop)
      .map((x) => {
        return { ...x, periode: new Date(x.periode.setHours(12, 0, 0, 0)).setDate(1) }
      })

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
        contentieux: { code_import: last(sum[key]).contentieux.code_import, label: last(sum[key]).contentieux.label },
      })
    })

    this.sendOk(ctx, {
      list: groupBy(activities, 'periode'),
      sumTab,
      lastUpdate,
    })
  }
}
