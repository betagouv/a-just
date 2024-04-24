import { VALUE_QUALITY_TO_VERIFY } from "../constants/activities"

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


export const isValueToVerifySetted = (value, contentieux, node, referentiel) => {
  if (value !== null) {
    switch (node) {
      case 'entrees': 
        if (value === contentieux.original_entrees && referentiel.value_quality_in === VALUE_QUALITY_TO_VERIFY)
          return true
        break;
      case 'sorties':
        if (value === contentieux.original_sorties && referentiel.value_quality_out === VALUE_QUALITY_TO_VERIFY)
          return true
        break;
      case "stock":
        if (value === contentieux.original_stock && referentiel.value_quality_stock === VALUE_QUALITY_TO_VERIFY)
          return true
        break;
      default:
        return false
    }
  } 
  return false   
}