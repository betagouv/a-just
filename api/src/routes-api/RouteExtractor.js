import Route, { Access } from './Route'
import { Types } from '../utils/types'
import {
  addSumLine,
  autofitColumns,
  computeExtract,
  computeExtractDdg,
  flatListOfContentieuxAndSousContentieux,
  getExcelLabel,
  replaceIfZero,
  sortByCatAndFct,
} from '../utils/extractor'
import { getHumanRessourceList } from '../utils/humanServices'
import { cloneDeep, groupBy, last, orderBy, sumBy } from 'lodash'
import { month } from '../utils/date'

/**
 * Route de la page extrateur
 */

export default class RouteExtractor extends Route {
  /**
   * Constructeur
   * @param {*} params
   */
  constructor (params) {
    super({ ...params, model: 'HumanResources' })
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
      categoryFilter: Types.string().required(),
    }),
    accesses: [Access.canVewHR],
  })
  async filterList (ctx) {
    let { backupId, dateStart, dateStop, categoryFilter } = this.body(ctx)
    if (!(await this.models.HRBackups.haveAccess(backupId, ctx.state.user.id))) {
      ctx.throw(401, "Vous n'avez pas accès à cette juridiction !")
    }

    const juridictionName = await this.models.HRBackups.findById(backupId)

    console.time('extractor-1')
    const referentiels = await this.models.ContentieuxReferentiels.getReferentiels()
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

    console.time('extractor-5')
    let allHuman = await getHumanRessourceList(hr, undefined, undefined, dateStart, dateStop)
    console.timeEnd('extractor-5')

    console.time('extractor-6')
    let onglet1 = await computeExtract(cloneDeep(allHuman), flatReferentielsList, categories, categoryFilter, juridictionName, dateStart, dateStop)
    console.timeEnd('extractor-6')

    const excelRef = [
      { global: null, sub: 'ETPT sur la période' },
      { global: null, sub: 'Temps ventilés sur la période' },
      ...flatReferentielsList.map((x) =>
        x.childrens !== undefined ? { global: getExcelLabel(x, true), sub: null } : { global: null, sub: getExcelLabel(x, false) }
      ),
      { global: null, sub: 'CET de + de 30 jours' },
      { global: 'Absentéisme réintégré (CMO + Congé maternité + CET de - de 30 jours)', sub: null },
      { global: null, sub: 'CET de - de 30 jours' },
    ]

    console.time('extractor-7')
    let onglet2 = await computeExtractDdg(cloneDeep(allHuman), flatReferentielsList, categories, categoryFilter, juridictionName, dateStart, dateStop)
    console.timeEnd('extractor-7')

    console.time('extractor-8')
    await onglet1.sort((a, b) => sortByCatAndFct(a, b))
    await onglet2.sort((a, b) => sortByCatAndFct(a, b))
    onglet1 = addSumLine(onglet1, categoryFilter)
    onglet2 = addSumLine(onglet2, categoryFilter)
    const columnSize1 = await autofitColumns(onglet1, true)
    const columnSize2 = await autofitColumns(onglet2)
    console.timeEnd('extractor-8')

    console.log(orderBy(flatReferentielsList, 'rank'))
    console.log(juridictionName.label)

    const tproxs = await this.models.tproxs.getByTj(new String(juridictionName.label).toUpperCase())

    this.sendOk(ctx, {
      referentiels,
      tproxs,
      onglet1: { values: onglet1, columnSize: columnSize1 },
      onglet2: { values: onglet2, columnSize: columnSize2, excelRef },
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

    if (!(await this.models.HRBackups.haveAccess(backupId, ctx.state.user.id))) {
      ctx.throw(401, "Vous n'avez pas accès à cette juridiction !")
    }

    const list = await this.models.Activities.getByMonth(dateStart, backupId)

    const lastUpdate = await this.models.HistoriesActivitiesUpdate.getLastUpdate(list.map((i) => i.id))

    let activities = await this.models.Activities.getAllDetails(backupId)
    activities = orderBy(activities, 'periode', ['asc']).filter((act) => act.periode >= month(dateStart, 0) && act.periode <= dateStop)

    let sum = cloneDeep(activities)
    sum = groupBy(sum, 'contentieux.id')

    let sumTab = []

    Object.keys(sum).map((key) => {
      sumTab.push({
        periode: replaceIfZero(last(sum[key]).periode),
        entrees: replaceIfZero(sumBy(sum[key], 'entrees')),
        sorties: replaceIfZero(sumBy(sum[key], 'sorties')),
        stock: replaceIfZero(last(sum[key]).stock),
        originalEntrees: replaceIfZero(sumBy(sum[key], 'originalEntrees')),
        originalSorties: replaceIfZero(sumBy(sum[key], 'originalSorties')),
        originalStock: replaceIfZero(last(sum[key]).originalStock),
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
