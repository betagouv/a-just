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

export const VALUE_QUALITY_OPTION = 'facultatif';
export const VALUE_QUALITY_GOOD = 'good';
export const VALUE_QUALITY_TO_COMPLETE = 'to_complete';
export const VALUE_QUALITY_TO_VERIFY = 'to_verify';
