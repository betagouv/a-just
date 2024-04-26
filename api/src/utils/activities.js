import { VALUE_QUALITY_TO_VERIFY } from "../constants/activities"

/**
 * Permet de vérifier parmis les enfants d'un contentieux, 
 * si il existe des donées modifiées et si parmis ces données 
 * il y a uniquement des données de qualité 'A verifier' 
 * qui sont bien vérifier (cad -> nouvelle valeur = original)
 * @param {*} childs 
 * @param {*} referentiels 
 * @param {*} type 
 * @param {*} originalType 
 * @param {*} qualityType 
 * @returns 
 */
export const checkTotalUpdates = (childs, referentiels, type, originalType, qualityType) => {

  let setTotal = false
  for (let child of childs) {
    if (child[type] !== null) {
      if (child[type] === child[originalType]) {
        const ref = referentiels.find(elem => elem.id === child.contentieux_id)
        if (ref[qualityType] === VALUE_QUALITY_TO_VERIFY) {
          setTotal = false
        } else {
          setTotal = true
          break
        }
      } else {
        setTotal = true
        break
      }
    }
  }
  return setTotal
}

/**
 * Formalise les activités d'un contentieux en fonction de ses sous contentieux
 * @param {*} childs
 * @returns
 */
export const calculMainValuesFromChilds = (childs, referentiels) => {
  const returnObject = {
    entrees: preformatActivitiesArray(childs, ['entrees', 'original_entrees']),
    original_entrees: preformatActivitiesArray(childs, ['original_entrees']),
    sorties: preformatActivitiesArray(childs, ['sorties', 'original_sorties']),
    original_sorties: preformatActivitiesArray(childs, ['original_sorties']),
    stock: preformatActivitiesArray(childs, ['stock', 'original_stock']),
    original_stock: preformatActivitiesArray(childs, ['original_stock']),
  }

  if (!checkTotalUpdates(childs, referentiels, 'original_entrees', 'original_entrees', 'value_quality_in')) {
    returnObject.original_entrees = null
  }

  if (!checkTotalUpdates(childs, referentiels, 'entrees', 'original_entrees', 'value_quality_in'))
    returnObject.entrees = null

  if (!checkTotalUpdates(childs, referentiels, 'original_sorties', 'original_sorties', 'value_quality_out'))
    returnObject.original_sorties = null

  if (!checkTotalUpdates(childs, referentiels, 'sorties', 'original_sorties', 'value_quality_out'))
    returnObject.sorties = null

  if (!checkTotalUpdates(childs, referentiels, 'original_stock', 'original_stock', 'value_quality_stock'))
    returnObject.original_stock = null

  if (!checkTotalUpdates(childs, referentiels, 'stock', 'stock', 'value_quality_stock'))
    returnObject.stock = null

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