import Route, { Access } from './Route'
import { Types } from '../utils/types'
import { getHRVentilation } from '../utils/calculator'
import {
  addSumLine,
  autofitColumns,
  computeCETDays,
  computeEtpt,
  computeExtractDdg,
  countEtp,
  emptyRefObj,
  flatListOfContentieuxAndSousContentieux,
  getExcelLabel,
  getIndispoDetails,
  replaceIfZero,
  sortByCatAndFct,
} from '../utils/extractor'
import { getHumanRessourceList } from '../utils/humanServices'
import { cloneDeep, groupBy, last, orderBy, sumBy } from 'lodash'
import { findSituation } from '../utils/human-resource'
import { month } from '../utils/date'
import { ABSENTEISME_LABELS, CET_LABEL } from '../constants/referentiel'

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
    console.log('dates exodia', dateStart, dateStop)

    const categories = await this.models.HRCategories.getAll()

    let allHuman = await getHumanRessourceList(hr, undefined, undefined, dateStart, dateStop)

    let onglet1 = new Array()
    let onglet2 = new Array()

    console.timeEnd('extractor-4')

    //ICI
    onglet1 = await computeExtractDdg(allHuman, flatReferentielsList, categories, categoryFilter, juridictionName, dateStart, dateStop)
    console.time('extractor-5')

    console.timeEnd('extractor-5')

    console.time('extractor-6')

    //ICI
    await onglet1.sort((a, b) => sortByCatAndFct(a, b))

    onglet1 = addSumLine(onglet1, categoryFilter)

    const columnSize = await autofitColumns(onglet1)
    console.timeEnd('extractor-6')

    this.sendOk(ctx, { values: onglet1, values2: onglet1, columnSize, dateStart: dateStart })
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

    console.log(sumTab)

    this.sendOk(ctx, {
      list: groupBy(activities, 'periode'),
      sumTab,
      lastUpdate,
    })
  }
}
