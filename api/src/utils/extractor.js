import { sumBy } from 'lodash';

/**
 * Return a flat list with Contentieux and Sous-Contentieux at the same level
 * @param {*} allReferentiels
 * @returns
 */
export const flatListOfContentieuxAndSousContentieux = (allReferentiels) => {
  for (let i = 0; i < allReferentiels.length; i++) {
    if (allReferentiels[i].childrens) {
      for (let y = allReferentiels[i].childrens.length - 1; y >= 0; y--) {
        allReferentiels.splice(i + 1, 0, allReferentiels[i].childrens[y]);
      }
    }
  }
  return allReferentiels;
};

export const countEtp = (etpAffected, referentiel) => {
  let counterEtpTotal = 0;
  let counterEtpSubTotal = 0;
  let counterIndispo = 0;

  Object.keys(etpAffected).map((key) => {
    if (referentiel.childrens !== undefined) {
      counterEtpTotal += etpAffected[key].etpt;
    } else {
      counterEtpSubTotal += etpAffected[key].etpt;
      counterIndispo += etpAffected[key].indispo;
    }
  });

  return { counterEtpTotal, counterEtpSubTotal, counterIndispo };
};

export const getIndispoDetails = (referentiels) => {
  const refIndispo = referentiels.find((r) => r.label === 'Indisponibilité');

  const allIndispRef = [];
  const idsIndispo = [];
  let idsMainIndispo = undefined;
  if (refIndispo) {
    idsMainIndispo = refIndispo.id;
    allIndispRef.push(refIndispo);
    idsIndispo.push(refIndispo.id);
    (refIndispo.childrens || []).map((c) => {
      idsIndispo.push(c.id);
      allIndispRef.push(c);
    });
  }

  const allIndispRefIds = allIndispRef.map(function (obj) {
    return obj.id;
  });

  return { refIndispo, allIndispRef, allIndispRefIds, idsMainIndispo };
};

export const addSumLine = (data, selectedCategory) => {
  if (selectedCategory !== 'tous') {
    let headerSum = new Object({});
    Object.keys(data[0]).map((key) => {
      const sum = sumBy(data, key);
      headerSum[key] = typeof sum === 'string' || key === 'Numéro_A_JUST' ? '' : sum;
      if (key === 'Fonction') headerSum[key] = 'SOMME';
    });
    data.push(headerSum);
  }
  return data;
};

export const autofitColumns = (json) => {
  const jsonKeys = Object.keys(json[0]);

  let objectMaxLength = [];
  for (let i = 0; i < json.length; i++) {
    let value = json[i];
    for (let j = 0; j < jsonKeys.length; j++) {
      if (typeof value[jsonKeys[j]] == 'number') {
        objectMaxLength[j] = 10;
      } else {
        const l = value[jsonKeys[j]] ? value[jsonKeys[j]].length : 0;
        objectMaxLength[j] = objectMaxLength[j] >= l ? objectMaxLength[j] : l;
      }
    }

    let key = jsonKeys;
    for (let j = 0; j < key.length; j++) {
      objectMaxLength[j] =
        objectMaxLength[j] >= key[j].length ? objectMaxLength[j] : key[j].length + 1.5;
    }
  }

  const wscols = objectMaxLength.map((w) => {
    return { width: w };
  });

  return wscols;
};
