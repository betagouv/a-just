/**
 * Formalise les activités d'un contentieux en fonction de ses sous contentieux
 * @param {*} childs
 * @returns
 */
export const calculMainValuesFromChilds = (childs) => {
  const returnObject = {
    entrees: preformatActivitiesArray(childs, ['entrees', 'original_entrees']),
    original_entrees: preformatActivitiesArray(childs, ['original_entrees']),
    sorties: preformatActivitiesArray(childs, ['sorties', 'original_sorties']),
    original_sorties: preformatActivitiesArray(childs, ['original_sorties']),
    stock: preformatActivitiesArray(childs, ['stock', 'original_stock']),
    original_stock: preformatActivitiesArray(childs, ['original_stock']),
  }

  if (childs.every((c) => c.original_entrees === null)) {
    returnObject.original_entrees = null
  }

  if (childs.every((c) => c.entrees === null)) {
    returnObject.entrees = null
  }

  if (childs.every((c) => c.original_sorties === null)) {
    returnObject.original_sorties = null
  }

  if (childs.every((c) => c.sorties === null)) {
    returnObject.sorties = null
  }

  if (childs.every((c) => c.original_stock === null)) {
    returnObject.original_stock = null
  }

  if (childs.every((c) => c.stock === null)) {
    returnObject.stock = null
  }

  return returnObject
}

/**
 * Calcul du total d'un node
 * @param {*} list
 * @param {*} index
 * @returns
 */
export const preformatActivitiesArray = (list, index) => {
  let total = null
  list.map((item) => {
    for (let i = 0; i < index.length; i++) {
      if (index[i] === 'stock' && item[index[i]] !== null && item[index[i]] !== 0) {
        total = (total || 0) + item[index[i]]
        break
      } else if (item[index[i]] !== null) {
        total = (total || 0) + item[index[i]]
        break
      }
    }
  })

  return total !== null && total < 0 ? 0 : total
}


/**
 * Compare deux données d'activité en messurant l'écart en % la différence absolue
 * @param {*} data1
 * @param {*} data2
 * @param {*} percentageThreshold
 * @param {*} absoluteThreshold
 */
export const compareGapBetweenData = (data1, data2, percentageThreshold, absoluteThreshold ) => {
  const absoluteDiff = Math.abs(data1 - data2)
  const gap = (absoluteDiff / data2) * 100

  if (gap >= percentageThreshold || absoluteDiff >= absoluteThreshold) {
    return {
      new: data1,
      last: data2,
    }
  }
  return null
}