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
  replaceZeroByDash,
  sortByCatAndFct,
} from '../utils/extractor'
import { preformatHumanResources } from '../utils/ventilator'
import { getHumanRessourceList } from '../utils/humanServices'
import { findFonctionName } from '../utils/hr-fonctions'
import { findCategoryName } from '../utils/hr-catagories'
import { sumBy } from 'lodash'
import { findSituation } from '../utils/human-resource'
export default class RouteExtractor extends Route {
  constructor (params) {
    super({ ...params, model: 'HumanResources' })
  }

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
    const fonctions = await this.models.HRFonctions.getAll()

    let allHuman = await getHumanRessourceList(hr, undefined, undefined, dateStart, dateStop)

    let data = new Array()
    console.timeEnd('extractor-4')

    console.time('extractor-5')
    await Promise.all(
      allHuman.map(async (human) => {
        const { currentSituation } = findSituation(human)

        console.log('findCategoryName', currentSituation.category)
        let categoryName = findCategoryName(categories, currentSituation)
        let fonctionName = findFonctionName(fonctions, currentSituation)

        let etpAffected = new Array()
        let refObj = { ...emptyRefObj(flatReferentielsList) }
        let totalEtpt = 0

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
                etpAffected = await getHRVentilation(
                  human,
                  referentiel.id,
                  [...categories],
                  dateStart,
                  dateStop
                )

                const { counterEtpTotal, counterEtpSubTotal, counterIndispo } = {
                  ...(await countEtp({ ...etpAffected }, referentiel)),
                }

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

        if (categoryName === categoryFilter || categoryFilter === 'tous')
          data.push({
            Numéro_A_JUST: human.id,
            Prénom: human.firstName,
            Nom: human.lastName,
            Catégorie: categoryName,
            Fonction: fonctionName,
            ETPT: totalEtpt,
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

    this.sendOk(ctx, { values: data, columnSize })
  }
}
