import { sortBy } from 'lodash';
import { month } from './date';

export const calculMainValuesFromChilds = (childs) => {
  const returnObject = {
    entrees: preformatActivitiesArray(childs, ['entrees', 'original_entrees']),
    original_entrees: preformatActivitiesArray(childs, ['original_entrees']),
    sorties: preformatActivitiesArray(childs, ['sorties', 'original_sorties']),
    original_sorties: preformatActivitiesArray(childs, ['original_sorties']),
    stock: preformatActivitiesArray(childs, ['stock', 'original_stock']),
    original_stock: preformatActivitiesArray(childs, ['original_stock']),
  };

  if (returnObject.entrees === returnObject.original_entrees) {
    returnObject.entrees = null;
  }

  if (returnObject.sorties === returnObject.original_sorties) {
    returnObject.sorties = null;
  }

  if (returnObject.stock === returnObject.original_stock) {
    returnObject.stock = null;
  }

  return returnObject;
};

export const preformatActivitiesArray = (list, index) => {
  let total = null;
  list.map((item) => {
    for (let i = 0; i < index.length; i++) {
      if (index[i] === 'stock' && item[index[i]] !== null && item[index[i]] !== 0) {
        total = (total || 0) + item[index[i]];
        break;
      } else if (item[index[i]] !== null) {
        total = (total || 0) + item[index[i]];
        break;
      }
    }
  });

  return total !== null && total < 0 ? 0 : total;
};

export async function filterActivitiesByDateAndContentieuxId(
  activities,
  referentielId,
  startDate,
  endDate
) {
  return sortBy(
    activities.filter(
      (a) =>
        a.contentieux.id === referentielId &&
        month(a.periode).getTime() >= month(startDate).getTime() &&
        month(a.periode).getTime() <= month(endDate).getTime()
    ),
    'periode'
  );
}
