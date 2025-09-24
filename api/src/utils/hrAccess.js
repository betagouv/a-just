import { HAS_ACCESS_TO_MAGISTRAT, HAS_ACCESS_TO_GREFFIER, HAS_ACCESS_TO_CONTRACTUEL } from '../constants/access'
import { canHaveUserCategoryAccess } from './hr-catagories'

export const cleanCalculationItemForUser = (item, user) => {
  const hasMag = canHaveUserCategoryAccess(user, HAS_ACCESS_TO_MAGISTRAT)
  const hasFon = canHaveUserCategoryAccess(user, HAS_ACCESS_TO_GREFFIER)
  const hasCont = canHaveUserCategoryAccess(user, HAS_ACCESS_TO_CONTRACTUEL)

  return {
    ...item,
    etpMag: hasMag ? item.etpMag : null,
    magRealTimePerCase: hasMag ? item.magRealTimePerCase : null,
    magCalculateCoverage: hasMag ? item.magCalculateCoverage : null,
    magCalculateDTESInMonths: hasMag ? item.magCalculateDTESInMonths : null,
    magCalculateTimePerCase: hasMag ? item.magCalculateTimePerCase : null,
    magCalculateOut: hasMag ? item.magCalculateOut : null,

    etpFon: hasFon ? item.etpFon : null,
    fonRealTimePerCase: hasFon ? item.fonRealTimePerCase : null,
    fonCalculateCoverage: hasFon ? item.fonCalculateCoverage : null,
    fonCalculateDTESInMonths: hasFon ? item.fonCalculateDTESInMonths : null,
    fonCalculateTimePerCase: hasFon ? item.fonCalculateTimePerCase : null,
    fonCalculateOut: hasFon ? item.fonCalculateOut : null,

    etpCont: hasCont ? item.etpCont : null,
  }
}
