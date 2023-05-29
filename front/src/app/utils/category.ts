/**
 * Récupère le titre d'une categorie maj
 * @param name string 
 * @returns string
 */
export const getCategoryTitle = (name: string): string => {
  console.log(name)
  switch(name){
  case 'Magistrat':
    return 'Siège'
  case 'Greffe':
    return 'Greffe'
  case 'Autour du Juge':
    return 'EOM'
  }
  return ''

}
