import { orderBy, sumBy } from 'lodash'
import { etpLabel } from '../constants/referentiel'
import { findSituation } from './human-resource'
import { findAllIndisponibilities } from './indisponibilities'
import { fixDecimal } from './number'

export const preformatHumanResources = (list, dateSelected, referentielList, fonctionsIds) => {
  console.log('fonctionsIds', fonctionsIds)
  return orderBy(
    list.map((h) => {
      const indisponibilities = dateSelected ? findAllIndisponibilities(h, dateSelected) : []
      let hasIndisponibility = fixDecimal(sumBy(indisponibilities, 'percent') / 100)
      if (hasIndisponibility > 1) {
        hasIndisponibility = 1
      }

      let currentSituation
      let etp = 0
      if (dateSelected) {
        const s = findSituation(h, dateSelected)
        currentSituation = s.currentSituation
        etp = (currentSituation && currentSituation.etp) || 0
        if (etp < 0) {
          etp = 0
        }
      } else {
        const situations = h.situations || []
        if (situations.length) {
          currentSituation = situations[0]
        }
      }

      return {
        ...h,
        currentActivities: (currentSituation && currentSituation.activities) || [],
        indisponibilities,
        etpLabel: etpLabel(etp),
        hasIndisponibility,
        currentSituation,
        etp: fixDecimal(etp, 100),
        category: currentSituation && currentSituation.category,
        fonction: currentSituation && currentSituation.fonction,
      }
    }),
    ['fonction.rank', 'lastName'],
    ['asc', 'asc']
  ).filter((hr) => {
    let isFiltered = true

    if (referentielList) {
      const activities = hr.currentActivities || []
      if (!activities.some((a) => referentielList.includes(a.contentieux.id))) {
        isFiltered = false
      }
    }

    if (fonctionsIds && hr.fonction) {
      if (!fonctionsIds.includes(hr.fonction.id)) {
        isFiltered = false
      }
    }

    return isFiltered
  })
}
