export const convertHumanNodeToActivitiesBDD = (node) => {
  switch (node) {
  case 'entrees':
    return 'in'
  case 'sorties':
    return 'out'
  case 'stock':
    return 'stock'
  }

  return node
}
