export const calculMainValuesFromChilds = (childs) => {
  return {
    entrees: preformatArray(childs, ['entrees', 'original_entrees']),
    sorties: preformatArray(childs, ['sorties', 'original_sorties']),
    stock: preformatArray(childs, ['stock', 'original_stock']),
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