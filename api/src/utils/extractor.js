
  
/**
 * Return a flat list with Contentieux and Sous-Contentieux at the same level
 * @param {*} allReferentiels 
 * @returns 
 */
export const flatListOfContentieuxAndSousContentieux = (allReferentiels) => {
for (let i = 0; i < allReferentiels.length; i++) {
    if (allReferentiels[i].childrens) {
        for (let y = allReferentiels[i].childrens.length - 1; y >= 0; y--) {
            allReferentiels.splice(i + 1, 0, allReferentiels[i].childrens[y])
        }
}
}
return allReferentiels
}