export const emptyCalulatorValues = (referentiels) => {
  const list = []
  for (let i = 0; i < referentiels.length; i++) {
    const childrens = (referentiels[i].childrens || []).map((c) => {
      const cont = { ...c, parent: referentiels[i] }

      return {
        totalIn: null,
        totalOut: null,
        lastStock: null,
        etpMag: null,
        etpFon: null,
        etpCont: null,
        realCoverage: null,
        realDTESInMonths: null,
        realTimePerCase: null,
        calculateCoverage: null,
        calculateDTESInMonths: null,
        calculateTimePerCase: null,
        calculateOut: null,
        etpAffected: [],
        childrens: [],
        contentieux: cont,
        nbMonth: 0,
      }
    })

    list.push({
      totalIn: null,
      totalOut: null,
      lastStock: null,
      etpMag: null,
      etpFon: null,
      etpCont: null,
      realCoverage: null,
      realDTESInMonths: null,
      realTimePerCase: null,
      calculateCoverage: null,
      calculateDTESInMonths: null,
      calculateTimePerCase: null,
      calculateOut: null,
      etpAffected: [],
      childrens,
      contentieux: referentiels[i],
      nbMonth: 0,
    })
  }

  return list
}

export const syncCalculatorDatas = (list, nbMonth) => {
  for (let i = 0; i < list.length; i++) {
    const childrens = (list[i].childrens || []).map((c) => ({
      ...c,
      nbMonth,
      // ...this.getActivityValues(c.contentieux, nbMonth),
    }))

    list[i] = {
      ...list[i],
      // ...this.getActivityValues(list[i].contentieux, nbMonth),
      childrens,
      nbMonth,
    }
  }

  return list
}
