import { orderBy, sumBy } from 'lodash'
import { etpLabel } from '../constants/referentiel'
import { findSituation } from './hr-situations'
import { findAllIndisponibilities } from './indisponibilities'
import { fixDecimal } from './number'

export const preformatHumanResources = (list, dateSelected) => {
  return orderBy(
    list.map((h) => {
      const indisponibilities =
        findAllIndisponibilities(
          h,
          dateSelected
        )
      let hasIndisponibility = fixDecimal(
        sumBy(indisponibilities, 'percent') / 100
      )
      if (hasIndisponibility > 1) {
        hasIndisponibility = 1
      }
      const currentSituation = findSituation(
        h,
        dateSelected
      )
      let etp = (currentSituation && currentSituation.etp) || 0
      if (etp < 0) {
        etp = 0
      }

      let firstSituation = currentSituation
      //console.log(h, currentSituation)
      if (!firstSituation) {
        firstSituation = findSituation(
          h,
          undefined,
          'asc'
        )
        etp = 1
      }

      return {
        ...h,
        currentActivities:
          (currentSituation && currentSituation.activities) || [],
        indisponibilities,
        etpLabel: etpLabel(etp),
        hasIndisponibility,
        currentSituation,
        etp,
        category: firstSituation && firstSituation.category,
        fonction: firstSituation && firstSituation.fonction,
      }
    }),
    ['fonction.rank', 'lastName'],
    ['asc', 'asc']
  )
}