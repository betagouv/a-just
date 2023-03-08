import Route, { Access } from './Route'
import { Types } from '../utils/types'
import { getHRVentilation } from '../utils/calculator'
import {
  addSumLine,
  autofitColumns,
  countEtp,
  emptyRefObj,
  flatListOfContentieuxAndSousContentieux,
  getExcelLabel,
  getIndispoDetails,
  replaceIfZero,
  replaceZeroByDash,
  sortByCatAndFct,
} from '../utils/extractor'
import { getHumanRessourceList } from '../utils/humanServices'
import { cloneDeep, first, groupBy, last, map, orderBy, reduce, sumBy } from 'lodash'
import { findSituation } from '../utils/human-resource'
import { generalizeTimeZone, month, monthDiffList } from '../utils/date'

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

    let allHuman = await getHumanRessourceList(hr, undefined, undefined, dateStart, dateStop)

    let data = new Array()
    console.timeEnd('extractor-4')

    console.time('extractor-5')
    await Promise.all(
      allHuman.map(async (human) => {
        const { currentSituation } = findSituation(human)

        let categoryName =
          currentSituation && currentSituation.category && currentSituation.category.label ? currentSituation.category.label : 'pas de catégorie'
        let fonctionName =
          currentSituation && currentSituation.fonction && currentSituation.fonction.label ? currentSituation.fonction.label : 'pas de fonction'

        let etpAffected = new Array()
        let refObj = { ...emptyRefObj(flatReferentielsList) }
        let totalEtpt = 0
        let reelEtp = 0

        let indispoArray = new Array([])
        const { allIndispRefIds, refIndispo } = getIndispoDetails(flatReferentielsList)

        indispoArray = [
          ...(await Promise.all(
            flatReferentielsList.map(async (referentiel) => {
              const situations = human.situations || []
              const indisponibilities = human.indisponibilities || []

              if (
                situations.some((s) => {
                  const activities = s.activities || []
                  return activities.some((a) => a.contentieux.id === referentiel.id)
                }) ||
                indisponibilities.some((indisponibility) => {
                  return indisponibility.contentieux.id === referentiel.id
                })
              ) {
                etpAffected = await getHRVentilation(human, referentiel.id, [...categories], dateStart, dateStop)

                const { counterEtpTotal, counterEtpSubTotal, counterIndispo, counterReelEtp } = {
                  ...(await countEtp({ ...etpAffected }, referentiel)),
                }

                reelEtp = reelEtp === 0 ? counterReelEtp : reelEtp

                const isIndispoRef = await allIndispRefIds.includes(referentiel.id)

                if (referentiel.childrens !== undefined && !isIndispoRef) {
                  const label = getExcelLabel(referentiel, true)
                  refObj[label] = counterEtpTotal
                  totalEtpt += counterEtpTotal
                } else {
                  const label = getExcelLabel(referentiel, false)
                  if (isIndispoRef) {
                    refObj[label] = counterIndispo / 100
                    return {
                      indispo: counterIndispo / 100,
                    }
                  } else refObj[label] = counterEtpSubTotal
                }
              }
              return { indispo: 0 }
            })
          )),
        ]

        const key = getExcelLabel(refIndispo, true)

        refObj[key] = sumBy(indispoArray, 'indispo')

        if (categoryName.toUpperCase() === categoryFilter.toUpperCase() || categoryFilter === 'tous')
          if (categoryName !== 'pas de catégorie' || fonctionName !== 'pas de fonction')
            data.push({
              ['Numéro A-JUST']: human.id,
              Matricule: human.matricule,
              Prénom: human.firstName,
              Nom: human.lastName,
              Catégorie: categoryName,
              Fonction: fonctionName,
              ['ETPT sur la période']: reelEtp,
              ['Temps ventilés sur la période  ']: totalEtpt,
              ...refObj,
            })
      })
    )
    console.timeEnd('extractor-5')

    console.time('extractor-6')

    await data.sort((a, b) => sortByCatAndFct(a, b))

    data = addSumLine(data, categoryFilter)
    data = replaceZeroByDash(data)
    const columnSize = await autofitColumns(data)
    console.timeEnd('extractor-6')

    console.log('Dates : ', dateStart, dateStop)

    this.sendOk(ctx, { values: data, columnSize })
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
