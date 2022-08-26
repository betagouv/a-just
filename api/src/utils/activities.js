export const calculMainValuesFromChilds = (childs) => {
  return {
    entrees: preformatActivitiesArray(childs, ['entrees', 'original_entrees']),
    original_entrees: preformatActivitiesArray(childs, ['original_entrees']),
    sorties: preformatActivitiesArray(childs, ['sorties', 'original_sorties']),
    original_sorties: preformatActivitiesArray(childs, ['original_sorties']),
    stock: preformatActivitiesArray(childs, ['stock', 'original_stock']),
    original_stock: preformatActivitiesArray(childs, ['original_stock']),
  }
}

export const preformatActivitiesArray = (list, index) => {
  let total = null
  list.map(item => {
    for(let i = 0; i < index.length; i++) {
      if(index[i] === 'stock' && (item[index[i]] !== null && item[index[i]] !== 0)) {
        total = (total || 0) + item[index[i]]
        break
      } else if(item[index[i]] !== null) {
        total = (total || 0) + item[index[i]]
        break
      }
    }
  })
  
  return total
}