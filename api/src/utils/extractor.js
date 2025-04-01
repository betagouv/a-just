import { orderBy, sortBy, sumBy } from "lodash";
import {
  ABSENTEISME_LABELS,
  CET_LABEL,
  DELEGATION_TJ,
} from "../constants/referentiel";
import {
  nbOfDays,
  nbWorkingDays,
  setTimeToMidDay,
  today,
  workingDay,
} from "./date";
import { findSituation } from "./human-resource";
import { getHRVentilation } from "../utils/calculator";
import {
  FUNCTIONS_ONLY_FOR_DDG_EXTRACTOR,
  FUNCTIONS_ONLY_FOR_DDG_EXTRACTOR_CA,
} from "../constants/extractor";
import { isCa, isTj } from "./ca";

/**
 * Tri par catégorie et par fonction
 * @param {*} a
 * @param {*} b
 * @returns boolean
 */
export function sortByCatAndFct(a, b) {
  if (a["Catégorie"] === b["Catégorie"]) {
    return a.Fonction < b.Fonction ? -1 : 1;
  } else {
    return a["Catégorie"] > b["Catégorie"] ? -1 : 1;
  }
}

/**
 * Créer un objet avec pour propriété la liste de contentieux passée en paramètre
 * @param {*} flatReferentielsList
 * @returns
 */
export function emptyRefObj(flatReferentielsList) {
  let obj = { ...JSON.parse(JSON.stringify({})) };
  flatReferentielsList.map((referentiel) => {
    if (referentiel.childrens !== undefined) {
      obj[getExcelLabel(referentiel, true)] = 0;
    } else obj[getExcelLabel(referentiel, false)] = 0;
  });
  return obj;
}

/**
 * Génére le label utilisé dans l'entête de l'export excel
 * @param {*} referentiel
 * @param {*} isTotal
 * @returns
 */
export const getExcelLabel = (referentiel, isTotal) => {
  if (isTotal)
    return (
      referentiel.code_import.toUpperCase() +
      " TOTAL " +
      referentiel.label.toUpperCase()
    );
  else
    return (
      referentiel.code_import.toUpperCase() +
      " " +
      referentiel.label.toUpperCase()
    );
};

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

/**
 * Calcule des d'ETP
 * @param {*} etpAffected
 * @param {*} referentiel
 * @returns objet d'ETP
 */
export const countEtp = (etpAffected, referentiel) => {
  let counterEtpTotal = 0;
  let counterEtpSubTotal = 0;
  let counterIndispo = 0;
  let counterReelEtp = 0;

  Object.keys(etpAffected).map((key) => {
    if (referentiel.childrens !== undefined) {
      counterEtpTotal += etpAffected[key].etpt;
      counterReelEtp =
        counterReelEtp < etpAffected[key].reelEtp
          ? etpAffected[key].reelEtp
          : counterReelEtp;
    } else {
      counterEtpSubTotal += etpAffected[key].etpt;
      counterIndispo += etpAffected[key].indispo;
    }
  });

  return {
    counterEtpTotal,
    counterEtpSubTotal,
    counterIndispo,
    counterReelEtp,
  };
};

/**
 * Récupère informations sur les indisponibilités
 * @param {*} referentiels
 * @returns objet d'indipos details
 */
export const getIndispoDetails = (referentiels) => {
  const refIndispo = referentiels.find((r) => r.label === "Indisponibilité");

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

/**
 * Ajout d'une ligne faisant la somme des ETP totals dans notre data set
 * @param {*} data
 * @param {*} selectedCategory
 * @returns data object
 */
export const addSumLine = (data, selectedCategory) => {
  if (selectedCategory !== "tous" && data.length !== 0) {
    let headerSum = new Object({});
    Object.keys(data[0]).map((key) => {
      const sum = sumBy(data, key);
      headerSum[key] =
        typeof sum === "string" ||
        [
          "Numéro A-JUST",
          "Ecart -> à contrôler",
          "Matricule",
          "TPROX",
          "Date d'arrivée",
          "Date de départ",
        ].includes(key)
          ? ""
          : sum;
      if (key === "Date de départ") headerSum[key] = "SOMME";
    });
    data.push(headerSum);
  }
  return data;
};

/**
 * Calcule la taille que doit faire la colonne sur excel en fonction de la taille du label de l'entête
 * @param {*} json
 * @returns object
 */
export const autofitColumns = (json, firstTab = false, len = 10) => {
  if (json.length !== 0) {
    const jsonKeys = Object.keys(json[0]);

    let objectMaxLength = [];
    for (let i = 0; i < json.length; i++) {
      let value = json[i];
      for (let j = 0; j < jsonKeys.length; j++) {
        if (typeof value[jsonKeys[j]] == "number") {
          objectMaxLength[j] = 10;
        } else {
          const l = value[jsonKeys[j]] ? value[jsonKeys[j]].length : 0;
          objectMaxLength[j] = objectMaxLength[j] >= l ? objectMaxLength[j] : l;
        }
      }

      let key = jsonKeys;
      for (let j = 0; j < key.length; j++) {
        objectMaxLength[j] =
          objectMaxLength[j] >= key[j].length
            ? objectMaxLength[j]
            : key[j].length + 1.5;
      }
    }

    const wscols = objectMaxLength.map((w) => {
      return { width: w };
    });

    if (firstTab)
      return wscols.map((w, index) => {
        if (index > len) return { width: 27 };
        else return { width: w.width };
      });

    return wscols;
  } else return [];
};

/**
 * Remplace les 0 par des _ dans un dataset
 * @param {*} data
 * @returns data set
 */
export const replaceZeroByDash = (data) => {
  for (let i = 0; i < data.length; i++) {
    Object.keys(data[i]).forEach((key) => {
      if (data[i][key] === 0) {
        data[i][key] = "-";
      }
    });
  }
  return data;
};

/**
 * Retourne null si 0
 * @param {*} value
 * @returns value
 */
export const replaceIfZero = (value) => {
  return value === 0 ? null : value;
};

export const computeCETDays = (indisponibilities, dateStart, dateStop) => {
  let now = new Date(dateStart);
  let nbDay = 0;
  do {
    if (workingDay(now)) {
      indisponibilities.filter((hra) => {
        if (now && today(hra.dateStart).getTime() <= now.getTime()) {
          if (hra.dateStop) {
            if (today(hra.dateStop).getTime() >= now.getTime()) {
              if (hra.contentieux.label === CET_LABEL) {
                nbDay++;
                return true;
              }
            }
          } else {
            if (hra.contentieux.label === CET_LABEL) {
              nbDay++;
              return true;
            }
          }
        }
        return false;
      });
    }
    now.setDate(now.getDate() + 1);
  } while (now.getTime() <= dateStop.getTime());
  return nbDay;
};

export const computeExtractDdg = async (
  models,
  allHuman,
  flatReferentielsList,
  categories,
  categoryFilter,
  juridictionName,
  dateStart,
  dateStop,
  isJirs
) => {
  let onglet2 = [];

  console.time("extractor-7.1");
  await Promise.all(
    allHuman.map(async (human) => {
      const { currentSituation } = findSituation(human);

      let categoryName =
        currentSituation &&
        currentSituation.category &&
        currentSituation.category.label
          ? currentSituation.category.label
          : "pas de catégorie";
      let fonctionName =
        currentSituation &&
        currentSituation.fonction &&
        currentSituation.fonction.code
          ? currentSituation.fonction.code
          : "pas de fonction";
      let fonctionCategory =
        currentSituation &&
        currentSituation.fonction &&
        currentSituation.fonction.category_detail
          ? currentSituation.fonction.category_detail
          : "";

      let refObj = { ...emptyRefObj(flatReferentielsList) };
      let totalEtpt = 0;
      let reelEtp = 0;
      let absenteisme = 0;
      let totalDaysGone = 0;
      let totalDays = 0;
      let indispoArray = new Array([]);
      let { allIndispRefIds, refIndispo } =
        getIndispoDetails(flatReferentielsList);

      let CETTotalEtp = 0;
      let nbGlobalDaysCET = 0;

      let nbCETDays = 0;
      let absLabels = [...ABSENTEISME_LABELS];

      dateStart = setTimeToMidDay(dateStart);
      dateStop = setTimeToMidDay(dateStop);

      nbCETDays = computeCETDays(human.indisponibilities, dateStart, dateStop);
      nbGlobalDaysCET = nbCETDays;

      if (nbGlobalDaysCET < 30) absLabels.push(CET_LABEL);

      indispoArray = [
        ...(await Promise.all(
          flatReferentielsList.map(async (referentiel) => {
            const situations = human.situations || [];
            const indisponibilities = human.indisponibilities || [];

            if (
              situations.some((s) => {
                const activities = s.activities || [];
                return activities.some(
                  (a) => a.contentieux.id === referentiel.id
                );
              }) ||
              indisponibilities.some((indisponibility) => {
                return indisponibility.contentieux.id === referentiel.id;
              })
            ) {
              const etpAffected = await getHRVentilation(
                models,
                human,
                referentiel.id,
                [...categories],
                dateStart,
                dateStop,
                true,
                absLabels
              );

              const {
                counterEtpTotal,
                counterEtpSubTotal,
                counterIndispo,
                counterReelEtp,
              } = {
                ...(await countEtp({ ...etpAffected }, referentiel)),
              };

              Object.keys(etpAffected).map((key) => {
                totalDaysGone =
                  totalDaysGone === 0 && etpAffected[key].nbDaysGone > 0
                    ? etpAffected[key].nbDaysGone
                    : totalDaysGone;
                totalDays =
                  totalDays === 0 && etpAffected[key].nbDay > 0
                    ? etpAffected[key].nbDay
                    : totalDays;
              });

              reelEtp = reelEtp === 0 ? counterReelEtp : reelEtp;

              const isIndispoRef = await allIndispRefIds.includes(
                referentiel.id
              );

              if (referentiel.childrens !== undefined && !isIndispoRef) {
                const label = getExcelLabel(referentiel, true);
                refObj[label] = counterEtpTotal;
                totalEtpt += counterEtpTotal;
              } else {
                const label = getExcelLabel(referentiel, false);
                if (isIndispoRef) {
                  refObj[label] = counterIndispo / 100;
                  if (referentiel.label === CET_LABEL)
                    CETTotalEtp = refObj[label];
                  if (absLabels.includes(referentiel.label))
                    absenteisme += refObj[label];
                  else
                    return {
                      indispo: counterIndispo / 100,
                    };
                } else {
                  refObj[label] = counterEtpSubTotal;
                }
              }
            }
            return { indispo: 0 };
          })
        )),
      ];

      const key = getExcelLabel(refIndispo, true);

      refObj[key] = sumBy(indispoArray, "indispo");

      if (reelEtp === 0) {
        let reelEtpObject = [];

        sortBy(human.situations, "dateStart", "asc").map((situation, index) => {
          let nextDateStart =
            situation.dateStart <= dateStart ? dateStart : situation.dateStart;
          nextDateStart = nextDateStart <= dateStop ? nextDateStart : null;
          const middleDate =
            human.situations[index].dateStart <= dateStop
              ? new Date(human.situations[index].dateStart)
              : null;
          const nextEndDate =
            middleDate && index < human.situations.length - 1
              ? middleDate
              : dateStop;
          let countNbOfDays = undefined;
          let countNbOfDaysGone = 0
          if (nextDateStart && nextEndDate)
            countNbOfDays = nbWorkingDays(
              new Date(nextDateStart),
              new Date(nextEndDate)
            );
          if (human.dateEnd<nextEndDate)
            countNbOfDaysGone = nbWorkingDays(
              today(human.dateEnd),
              today(nextEndDate)
            );
          if (
            typeof countNbOfDays === "number" &&
            nextDateStart <= nextEndDate
          ) {
            reelEtpObject.push({
              etp: situation.etp * (countNbOfDays-countNbOfDaysGone),
              countNbOfDays: countNbOfDays-countNbOfDaysGone,
            });
          }
        });

        const isGone = dateStop > human.dateEnd && human.dateEnd > dateStart;
        const hasArrived =
          dateStart < human.dateStart && human.dateStart < dateStop;

        if (human.dateEnd && isGone && hasArrived && dateStart) {
          reelEtp =
            (sumBy(reelEtpObject, "etp") /
            sumBy(reelEtpObject, "countNbOfDays")
            - (refObj[key] || 0)*(sumBy(reelEtpObject, "countNbOfDays")+totalDaysGone)/sumBy(reelEtpObject, "countNbOfDays"))  
            *
            nbOfDays(human.dateStart, human.dateEnd) /
            nbOfDays(dateStart, dateStop)

            if (human.id===36732){
              console.log('etp', sumBy(reelEtpObject, "etp") /sumBy(reelEtpObject, "countNbOfDays"))
              console.log('indispo', (refObj[key] || 0)*(sumBy(reelEtpObject, "countNbOfDays")+totalDaysGone)/sumBy(reelEtpObject, "countNbOfDays"))
              console.log('nbofPresentDays',nbOfDays(human.dateStart, human.dateEnd))
              console.log('nbDays on period',nbOfDays(dateStart, dateStop))
              console.log('extract dates', dateStart, dateStop)
              console.log('extract dates', human.dateStart, human.dateEnd)
              console.log('days gone and total nb of days',  sumBy(reelEtpObject, "countNbOfDays"), totalDaysGone)

            }
        } else if (human.dateEnd && isGone) {
          reelEtp =
            (sumBy(reelEtpObject, "etp") /
            sumBy(reelEtpObject, "countNbOfDays")
            - (refObj[key] || 0)*(sumBy(reelEtpObject, "countNbOfDays")+totalDaysGone)/sumBy(reelEtpObject, "countNbOfDays"))  
            *
              nbOfDays(dateStart, human.dateEnd) /
              nbOfDays(dateStart, dateStop) 
        } else if (hasArrived && dateStart) {
          reelEtp =
          (sumBy(reelEtpObject, "etp") /
          sumBy(reelEtpObject, "countNbOfDays")
          - (refObj[key] || 0)*(sumBy(reelEtpObject, "countNbOfDays")+totalDaysGone)/sumBy(reelEtpObject, "countNbOfDays"))  *
              nbOfDays(human.dateStart, dateStop) /
              nbOfDays(dateStart, dateStop) 
        } else {
          reelEtp =
          (sumBy(reelEtpObject, "etp") /
          sumBy(reelEtpObject, "countNbOfDays")
          - (refObj[key] || 0)*(sumBy(reelEtpObject, "countNbOfDays")+totalDaysGone)/sumBy(reelEtpObject, "countNbOfDays")) ;
        }


      }

      if (isCa()) {
        Object.keys(refObj).map((k) => {
          if (k.includes(DELEGATION_TJ.toUpperCase()))
            refObj[key] = refObj[key] - refObj[k];
        });
      }

      ["14.2. COMPTE ÉPARGNE TEMPS", "12.2. COMPTE ÉPARGNE TEMPS"].forEach(
        (cle) => {
          if (refObj.hasOwnProperty(cle)) {
            delete refObj[cle];
          }
        }
      );

      let absenteismeDetails = null;
      let delegation = null;
      if (isCa()) {
        ({ refObj, delegation } = getAndDeleteAbsenteisme(
          refObj,
          ["14.13. DÉLÉGATION TJ"],
          true
        ));

        ({ refObj, absenteismeDetails } = getAndDeleteAbsenteisme(refObj, [
          "14.4. CONGÉ MALADIE ORDINAIRE",
          "14.5. CONGÉ MATERNITÉ/PATERNITÉ/ADOPTION",
          "14.14. AUTRE ABSENTÉISME",
        ]));
      }
      if (isTj()) {
        ({ refObj, absenteismeDetails } = getAndDeleteAbsenteisme(refObj, [
          "12.31. CONGÉ MALADIE ORDINAIRE",
          "12.32. CONGÉ MATERNITÉ/PATERNITÉ/ADOPTION",
          "12.8. AUTRE ABSENTÉISME",
        ]));
      }

      if (categoryFilter.includes(categoryName.toLowerCase()))
        if (
          categoryName !== "pas de catégorie" ||
          fonctionName !== "pas de fonction"
        ) {
          if (human.juridiction && human.juridiction.length !== 0)
            human.juridiction = human.juridiction.replaceAll("TPR ", "TPRX ");

          let gaps = null;
          if (isCa()) {
            gaps = {
              ["Ecart CTX MINEURS → détails manquants, à rajouter dans A-JUST"]:
                null,
              ["___"]: null,
            };
          }
          if (isTj()) {
            gaps = {
              ["Ecart JE → détails manquants, à rajouter dans A-JUST"]: null,
              ["Ecart JI → détails manquants, à rajouter dans A-JUST"]: null,
            };
          }
          onglet2.push({
            ["Réf."]: String(human.id),
            Arrondissement: juridictionName.label,
            Jirs: isJirs ? "x" : "",
            Juridiction: (
              human.juridiction || juridictionName.label
            ).toUpperCase(),
            Nom: human.lastName,
            Prénom: human.firstName,
            Matricule: human.matricule,
            Catégorie: categoryName,
            Fonction: fonctionName,
            ["Fonction recodée"]: null,
            ["Code fonction par défaut"]: fonctionCategory,
            ["Fonction agrégat"]: null,
            ["TJCPH"]: null,
            ["Date d'arrivée"]:
              human.dateStart === null
                ? null
                : setTimeToMidDay(human.dateStart).toISOString().split("T")[0],
            ["Date de départ"]:
              human.dateEnd === null
                ? null
                : setTimeToMidDay(human.dateEnd).toISOString().split("T")[0],
            ["ETPT sur la période absentéisme non déduit (hors action 99)"]:
              reelEtp < 0 ? 0 : reelEtp,
            ["Temps ventilés sur la période (hors action 99)"]: totalEtpt,
            ["Ecart → ventilations manquantes dans A-JUST"]:
              reelEtp - totalEtpt > 0.0001 ? reelEtp - totalEtpt : "-",
            ...gaps,
            ...refObj,
            ["CET > 30 jours"]: nbGlobalDaysCET >= 30 ? CETTotalEtp : 0,
            ["CET < 30 jours"]: nbGlobalDaysCET < 30 ? CETTotalEtp : 0,
            ...absenteismeDetails,
            ["TOTAL absentéisme réintégré (CMO + Congé maternité + Autre absentéisme  + CET < 30 jours)"]:
              absenteisme,
            ...(isCa() ? delegation : {}),
          });
        }
    })
  );
  console.timeEnd("extractor-7.1");
  return onglet2;
};

export const getViewModel = async (params) => {
  const keys1 =
    params.onglet1.values != null && params.onglet1.values.length
      ? Object.keys(params.onglet1.values[0])
      : [];
  let keys2 =
    params.onglet2.values != null && params.onglet2.values.length
      ? Object.keys(params.onglet2.values[0])
      : [];

  if (isCa()) {
    keys2 = keys2.map((x) =>
      x === "14. TOTAL INDISPONIBILITÉ"
        ? "14. TOTAL des INDISPONIBILITÉS relevant de l'action 99"
        : x
    );

    keys2 = keys2.filter(
      (x) =>
        !["14.2. COMPTE ÉPARGNE TEMPS", "12.2. COMPTE ÉPARGNE TEMPS"].includes(
          x
        )
    );
  } else {
    keys2 = keys2.map((x) =>
      x === "12. TOTAL INDISPONIBILITÉ"
        ? "12. TOTAL des INDISPONIBILITÉS relevant de l'action 99"
        : x
    );
  }

  const tgilist = [...params.allJuridiction]
    .filter((x) => x.type === "TGI")
    .map((x) => x.tprox);
  const tpxlist = [...params.allJuridiction]
    .filter((x) => x.type === "TPRX")
    .map((x) => x.tprox);
  const cphlist = [...params.allJuridiction]
    .filter((x) => x.type === "CPH")
    .map((x) => x.tprox);

  let uniqueJur = await sortBy(params.tproxs, "tprox").map((t) => t.tprox);
  const uniqueCity = uniqueJur.map((x) => {
    const [first, rest] = x.split(/\s+(.*)/);
    return rest;
  });
  const isolatedCPH = cphlist.filter((x) => {
    const [first, rest] = x.split(/\s+(.*)/);
    if (rest.length && uniqueCity.includes(rest)) return false;
    else return true;
  });
  uniqueJur = [...uniqueJur, ...isolatedCPH];
  const uniqueJurIndex = await uniqueJur.map((value, index) => [value, index]);
  const tProximite = [
    '"' +
      (await uniqueJur
        .join(",")
        .replaceAll("'", "")
        .replaceAll("(", "")
        .replaceAll(")", "")) +
      '"',
  ];
  let agregat = params.onglet2.excelRef.filter(
    (x) =>
      !["14.2. COMPTE ÉPARGNE TEMPS", "12.2. COMPTE ÉPARGNE TEMPS"].includes(
        x.sub
      )
  );

  agregat = agregat.map((x) => {
    if (x.sub === "14.13. DÉLÉGATION TJ" && isCa()) {
      return {
        ...x,
        global: "14.13. DÉLÉGATION TJ",
        global1: "DÉLÉGATION TJ",
        sub: null,
        sub1: null,
      };
    }

    if (x.global === "12. TOTAL INDISPONIBILITÉ" && isTj())
      return {
        ...x,
        global: "12. TOTAL des INDISPONIBILITÉS relevant de l'action 99",
        global1: "12. TOTAL des INDISPONIBILITÉS relevant de l'action 99",
        sub1: x.sub,
      };

    if (x.global === "14. TOTAL INDISPONIBILITÉ" && isCa())
      return {
        ...x,
        global: "14. TOTAL des INDISPONIBILITÉS relevant de l'action 99",
        global1: "14. TOTAL des INDISPONIBILITÉS relevant de l'action 99",
        sub1: x.sub,
      };

    if (
      x.global ===
        "TOTAL absentéisme réintégré (CMO + Congé maternité + Autre absentéisme  + CET < 30 jours)" &&
      isTj()
    )
      return {
        ...x,
        global1:
          "13. TOTAL des INDISPONIBILITÉS relevant de l'absentéisme (réintégrés dans les valeurs des rubriques et sous-rubriques)",
        sub1: x.sub,
      };

    if (
      x.global ===
        "TOTAL absentéisme réintégré (CMO + Congé maternité + Autre absentéisme  + CET < 30 jours)" &&
      isCa()
    )
      return {
        ...x,
        global1:
          "15. TOTAL des INDISPONIBILITÉS relevant de l'absentéisme (réintégrés dans les valeurs des rubriques et sous-rubriques)",
        sub1: x.sub,
      };

    return { ...x, sub1: x.sub, global1: x.global };
  });

  const index = agregat.findIndex(
    (item) => item.global === "14.13. DÉLÉGATION TJ"
  );

  if (index !== -1) {
    const [element] = agregat.splice(index, 1); // Retire l'élément du tableau
    agregat.push(element); // Ajoute l'élément à la fin
  }

  return {
    tgilist,
    tpxlist,
    cphlist,
    uniqueJur,
    uniqueJurIndex,
    tProximite,
    isolatedCPH,
    agregat,
    referentiel: params.referentiels.map((x) => {
      return {
        ...x,
        childrens: [
          ...x.childrens.map((y) => {
            return y.label;
          }),
        ],
      };
    }),
    arrondissement: uniqueJur[0],
    subtitles: [...Array(keys1.length > 6 ? keys1.length - 6 : 0)],
    days: keys1,
    stats: {
      ...params.onglet1.values.map((item) => {
        return { actions: Object.keys(item).map((key) => item[key]) };
      }),
    },
    subtitles1: [...Array(keys1.length > 6 ? keys2.length - 6 : 0)],
    days1: keys2,
    stats1: {
      ...params.onglet2.values.map((item) => {
        return { actions: Object.keys(item).map((key) => item[key]) };
      }),
    },
  };
};

export const computeExtract = async (
  models,
  allHuman,
  flatReferentielsList,
  categories,
  categoryFilter,
  juridictionName,
  dateStart,
  dateStop,
  isJirs
) => {
  let data = [];

  console.time("extractor-6.0");
  await Promise.all(
    allHuman.map(async (human) => {
      const { currentSituation } = findSituation(human);

      let categoryName =
        currentSituation &&
        currentSituation.category &&
        currentSituation.category.label
          ? currentSituation.category.label
          : "pas de catégorie";
      let fonctionName =
        currentSituation &&
        currentSituation.fonction &&
        currentSituation.fonction.code
          ? currentSituation.fonction.code
          : "pas de fonction";

      let etpAffected = new Array();
      let refObj = { ...emptyRefObj(flatReferentielsList) };
      let totalEtpt = 0;
      let reelEtp = 0;
      let totalDaysGone = 0;
      let totalDays = 0;

      let indispoArray = new Array([]);
      const { allIndispRefIds, refIndispo } =
        getIndispoDetails(flatReferentielsList);

      indispoArray = [
        ...(await Promise.all(
          flatReferentielsList.map(async (referentiel) => {
            const situations = human.situations || [];
            const indisponibilities = human.indisponibilities || [];

            if (
              situations.some((s) => {
                const activities = s.activities || [];
                return activities.some(
                  (a) => a.contentieux.id === referentiel.id
                );
              }) ||
              indisponibilities.some((indisponibility) => {
                return indisponibility.contentieux.id === referentiel.id;
              })
            ) {
              etpAffected = await getHRVentilation(
                models,
                human,
                referentiel.id,
                [...categories],
                dateStart,
                dateStop
              );

              const {
                counterEtpTotal,
                counterEtpSubTotal,
                counterIndispo,
                counterReelEtp,
              } = {
                ...(await countEtp({ ...etpAffected }, referentiel)),
              };

              Object.keys(etpAffected).map((key) => {
                totalDaysGone =
                  totalDaysGone === 0 && etpAffected[key].nbDaysGone > 0
                    ? etpAffected[key].nbDaysGone
                    : totalDaysGone;
                totalDays =
                  totalDays === 0 && etpAffected[key].nbDay > 0
                    ? etpAffected[key].nbDay
                    : totalDays;
              });

              reelEtp = reelEtp === 0 ? counterReelEtp : reelEtp;

              const isIndispoRef = await allIndispRefIds.includes(
                referentiel.id
              );

              if (referentiel.childrens !== undefined && !isIndispoRef) {
                const label = getExcelLabel(referentiel, true);
                refObj[label] = counterEtpTotal;
                totalEtpt += counterEtpTotal;
              } else {
                const label = getExcelLabel(referentiel, false);
                if (isIndispoRef) {
                  refObj[label] = counterIndispo / 100;
                  return {
                    indispo: counterIndispo / 100,
                  };
                } else refObj[label] = counterEtpSubTotal;
              }
            }
            return { indispo: 0 };
          })
        )),
      ];

      const key = getExcelLabel(refIndispo, true);

      refObj[key] = sumBy(indispoArray, "indispo");

      if (reelEtp === 0) {
        dateStart = setTimeToMidDay(dateStart);
        dateStop = setTimeToMidDay(dateStop);

        let reelEtpObject = [];

        sortBy(human.situations, "dateStart", "asc").map((situation, index) => {
          let nextDateStart =
            situation.dateStart <= dateStart ? dateStart : situation.dateStart;
          nextDateStart = nextDateStart <= dateStop ? nextDateStart : null;
          const middleDate =
            human.situations[index].dateStart <= dateStop
              ? new Date(human.situations[index].dateStart)
              : null;
          const nextEndDate =
            middleDate && index < human.situations.length - 1
              ? middleDate
              : dateStop;
          let countNbOfDays = undefined;
          if (nextDateStart && nextEndDate)
            countNbOfDays = nbWorkingDays(
              new Date(nextDateStart),
              new Date(nextEndDate)
            );
          if (
            typeof countNbOfDays === "number" &&
            nextDateStart <= nextEndDate
          ) {
            reelEtpObject.push({
              etp: situation.etp * countNbOfDays,
              countNbOfDays: countNbOfDays,
            });
          }
        });

        const isGone = dateStop > human.dateEnd && human.dateEnd > dateStart;
        const hasArrived =
          dateStart < human.dateStart && human.dateStart < dateStop;

        if (human.dateEnd && isGone && hasArrived && dateStart) {
          reelEtp =
            ((sumBy(reelEtpObject, "etp") /
              sumBy(reelEtpObject, "countNbOfDays")) *
              nbOfDays(human.dateStart, human.dateEnd)) /
              nbOfDays(dateStart, dateStop) -
            (refObj[key] || 0);
        } else if (human.dateEnd && isGone) {
          reelEtp =
            ((sumBy(reelEtpObject, "etp") /
              sumBy(reelEtpObject, "countNbOfDays")) *
              nbOfDays(dateStart, human.dateEnd)) /
              nbOfDays(dateStart, dateStop) -
            (refObj[key] || 0);
        } else if (hasArrived && dateStart) {
          reelEtp =
            ((sumBy(reelEtpObject, "etp") /
              sumBy(reelEtpObject, "countNbOfDays")) *
              nbOfDays(human.dateStart, dateStop)) /
              nbOfDays(dateStart, dateStop) -
            (refObj[key] || 0);
        } else {
          reelEtp =
            sumBy(reelEtpObject, "etp") /
              sumBy(reelEtpObject, "countNbOfDays") -
            (refObj[key] || 0);
        }
      }


      let delegation = null;

      if (isCa()) {
        Object.keys(refObj).map((k) => {
          if (k.includes(DELEGATION_TJ.toUpperCase()))
            refObj[key] = refObj[key] - refObj[k];
        });

        ({ refObj, delegation } = getAndDeleteAbsenteisme(
          refObj,
          ["14.13. DÉLÉGATION TJ"],
          true
        ));

        const newKey = "14.13. DÉLÉGATION TJ";
        const targetKey = "14. TOTAL INDISPONIBILITÉ";

        let result = {};

        // Parcourir les paires clé-valeur de l'objet original
        for (const [key, value] of Object.entries(refObj)) {
          if (key === targetKey) {
            // Insérer le nouvel élément avant le target
            result = { ...result, ...delegation };
          }
          result[key] = value;
        }

        refObj = result;
      }

      if (categoryFilter.includes(categoryName.toLowerCase()))
        if (
          categoryName !== "pas de catégorie" ||
          fonctionName !== "pas de fonction"
        )
          data.push({
            ["Réf."]: String(human.id),
            ...(isCa()
              ? { Juridiction: juridictionName.label }
              : { Arrondissement: juridictionName.label }),
            Nom: human.lastName,
            Prénom: human.firstName,
            Matricule: human.matricule,
            Catégorie: categoryName,
            Fonction: fonctionName,
            ["Fonction recodée"]: null,
            ...(isCa() ? { ["_"]: null } : { ["TJCPH"]: null }),
            ...(isCa() ? { ["__"]: null } : { ["Juridiction"]: null }),
            Jirs: isJirs ? "x" : "",
            ["Date d'arrivée"]:
              human.dateStart === null
                ? null
                : setTimeToMidDay(human.dateStart).toISOString().split("T")[0],
            ["Date de départ"]:
              human.dateEnd === null
                ? null
                : setTimeToMidDay(human.dateEnd).toISOString().split("T")[0],
            ["ETPT sur la période (absentéisme et action 99 déduits)"]:
              reelEtp < 0 ? 0 : reelEtp,
            ["Temps ventilés sur la période (absentéisme et action 99 déduits)"]:
              totalEtpt,
            ...refObj,
            ...(isCa() ? delegation : {}),
          });
    })
  );

  console.timeEnd("extractor-6.0");

  return data;
};

export const formatFunctions = async (functionList) => {
  let list = [
    ...functionList,
    ...(isCa()
      ? FUNCTIONS_ONLY_FOR_DDG_EXTRACTOR_CA
      : FUNCTIONS_ONLY_FOR_DDG_EXTRACTOR),
  ];
  list = list.map((fct) => {
    return { CONCAT: fct["category_label"] + fct["code"], ...fct };
  });

  return orderBy(
    list,
    ["category_label", "rank", "code"],
    ["desc", "asc", "asc"]
  );
};

export const getObjectKeys = async (array) => {
  if (array.length === 0) return [];
  return Object.keys(array[0]);
};

export const deplacerClefALaFin = (obj, clef) => {
  if (obj.hasOwnProperty(clef)) {
    const valeur = obj[clef]; // Sauvegarde la valeur
    delete obj[clef]; // Supprime la clé
    obj[clef] = valeur; // Réinsère la clé à la fin
  }
  return obj;
};

export const getAndDeleteAbsenteisme = (obj, labels, delegation = false) => {
  let absDetails = {};
  labels.map((label) => {
    if (obj.hasOwnProperty(label)) {
      const valeur = obj[label]; // Sauvegarde la valeur
      delete obj[label]; // Supprime la clé
      absDetails[label] = valeur;
    }
  });

  if (delegation === true) return { refObj: obj, delegation: absDetails };
  else return { refObj: obj, absenteismeDetails: absDetails };
};
