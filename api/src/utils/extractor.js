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

  Object.keys(etpAffected).map((key) => {
    if (referentiel.childrens !== undefined) {
      counterEtpTotal += etpAffected[key].etpt;
    } else {
      counterEtpSubTotal += etpAffected[key].etpt;
    }
  });

  return { counterEtpTotal, counterEtpSubTotal };
};

export const getIndispoDetails = (referentiels) => {
  const refIndispo = referentiels.find((r) => r.label === 'Indisponibilité');

  const allIndisponibilityReferentiel = [];
  const idsIndispo = [];

  if (refIndispo) {
    let idsMainIndispo = refIndispo.id;
    allIndisponibilityReferentiel.push(refIndispo);
    idsIndispo.push(refIndispo.id);
    (refIndispo.childrens || []).map((c) => {
      idsIndispo.push(c.id);
      allIndisponibilityReferentiel.push(c);
    });
  }

  allIndisponibilityReferentielIds = allIndisponibilityReferentiel.map(function (obj) {
    return obj.id;
  });

  return { refIndispo, allIndispRef, allIndispRefIds, idsMainIndispo };
};
