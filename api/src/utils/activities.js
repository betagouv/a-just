export const calculMainValuesFromChilds = (childs) => {
  return {
    entrees: preformatArray(childs, ['entrees', 'original_entrees']),
    original_entrees: preformatArray(childs, ['original_entrees']),
    sorties: preformatArray(childs, ['sorties', 'original_sorties']),
    original_sorties: preformatArray(childs, ['original_sorties']),
    stock: preformatArray(childs, ['stock', 'original_stock']),
    original_stock: preformatArray(childs, ['original_stock']),
  }
}

const preformatArray = (list, index) => {
  let total = null
  list.map(item => {
    for(let i = 0; i < index.length; i++) {
      if(item[index[i]] !== null) {
        total = (total || 0) + item[index[i]]
        break
      }
    }
  })
  
  return total
}