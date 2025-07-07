import { orderBy, sumBy } from 'lodash'
import { etpLabel } from '../constants/referentiel'
import { findSituation } from './human-resource'
import { findAllIndisponibilities } from './indisponibilities'
import { fixDecimal } from './number'
import { checkAbort } from './abordTimeout'

export const preformatHumanResources = (list, dateSelected, referentielList, fonctionsIds, signal = null) => {
  return orderBy(
    list.map((h) => {
      checkAbort(signal)
      const indisponibilities = dateSelected ? findAllIndisponibilities(h, dateSelected) : []
      let hasIndisponibility = fixDecimal(sumBy(indisponibilities, 'percent') / 100)
      if (hasIndisponibility > 1) {
        hasIndisponibility = 1
      }

      let currentSituation
      let etp = 0
      if (dateSelected) {
        checkAbort(signal)
        const s = findSituation(h, dateSelected, signal)
        checkAbort(signal)
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
      checkAbort(signal)

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
    ['asc', 'asc'],
  ).filter((hr) => {
    let isFiltered = true
    checkAbort(signal)

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
    checkAbort(signal)

    return isFiltered
  })
}

export const listCategories = (list) => {
  return list.map((h) => {
    let currentSituation
    const situations = h.situations || []
    if (situations.length) {
      currentSituation = situations[0]
    }

    return {
      ...h,
      category: currentSituation && currentSituation.category,
    }
  })
}
