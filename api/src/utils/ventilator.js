import { orderBy, sumBy } from 'lodash'
import { etpLabel } from '../constants/referentiel'
import { findAllSituations, findSituation } from './human-resource'
import { findAllIndisponibilities } from './indisponibilities'
import { fixDecimal } from './number'

export const preformatHumanResources = (list, dateSelected, referentielList, fonctionsIds) => {
  return orderBy(
    list.map((h) => {
      const indisponibilities = findAllIndisponibilities(h, dateSelected)
      let hasIndisponibility = fixDecimal(sumBy(indisponibilities, 'percent') / 100)
      if (hasIndisponibility > 1) {
        hasIndisponibility = 1
      }
      const { currentSituation } = findSituation(h, dateSelected)
      let etp = (currentSituation && currentSituation.etp) || 0
      if (etp < 0) {
        etp = 0
      }

      let firstSituation = currentSituation

      if (!firstSituation) {
        const allSituation = findAllSituations(h)
        firstSituation = allSituation.length ? allSituation[allSituation.length - 1] : null
        etp = 1
      }

      return {
        ...h,
        currentActivities: (currentSituation && currentSituation.activities) || [],
        indisponibilities,
        etpLabel: etpLabel(etp),
        hasIndisponibility,
        currentSituation,
        etp: fixDecimal(etp, 100),
        category: firstSituation && firstSituation.category,
        fonction: firstSituation && firstSituation.fonction,
      }
    }),
    ['fonction.rank', 'lastName'],
    ['asc', 'asc']
  ).filter((hr) => {
    if (referentielList) {
      const activities = hr.currentActivities || []
      return activities.some((a) => referentielList.includes(a.contentieux.id))
    }

    console.log('FX - 1')
    if (fonctionsIds && hr.fonction) {
      console.log('FX', hr.id, hr.fonction, fonctionsIds.includes(hr.fonction.id), fonctionsIds)
      return fonctionsIds.includes(hr.fonction.id)
    }

    return true
  })
}
