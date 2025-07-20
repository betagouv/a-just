import { cloneDeep, orderBy, sortBy, sumBy } from 'lodash'
import { ABSENTEISME_LABELS, CET_LABEL, DELEGATION_TJ } from '../constants/referentiel'
import { getNextDay, nbOfDays, nbWorkingDays, setTimeToMidDay, today, workingDay } from './date'
import { findSituation } from './human-resource'
import { getHRVentilation } from '../utils/calculator'
import { FUNCTIONS_ONLY_FOR_DDG_EXTRACTOR, FUNCTIONS_ONLY_FOR_DDG_EXTRACTOR_CA } from '../constants/extractor'
import { isCa, isTj } from './ca'
import { checkAbort } from './abordTimeout'

/**
 * Tri par catégorie et par fonction
 * @param {*} a
 * @param {*} b
 * @returns boolean
 */
export function sortByCatAndFct(a, b) {
  if (a['Catégorie'] === b['Catégorie']) {
    return a.Fonction < b.Fonction ? -1 : 1
  } else {
    return a['Catégorie'] > b['Catégorie'] ? -1 : 1
  }
}

/**
 * Créer un objet avec pour propriété la liste de contentieux passée en paramètre
 * @param {*} flatReferentielsList
 * @returns
 */
export function emptyRefObj(flatReferentielsList) {
  let obj = { ...JSON.parse(JSON.stringify({})) }
  flatReferentielsList.map((referentiel) => {
    if (referentiel.childrens !== undefined) {
      obj[getExcelLabel(referentiel, true)] = 0
    } else obj[getExcelLabel(referentiel, false)] = 0
  })
  return obj
}

/**
 * Génére le label utilisé dans l'entête de l'export excel
 * @param {*} referentiel
 * @param {*} isTotal
 * @returns
 */
export const getExcelLabel = (referentiel, isTotal) => {
  if (isTotal) return referentiel.code_import.toUpperCase() + ' TOTAL ' + referentiel.label.toUpperCase()
  else return referentiel.code_import.toUpperCase() + ' ' + referentiel.label.toUpperCase()
}

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
/**
 * Calcule des d'ETP par catégorie optimisé
 * @param {*} etpAffected
 * @param {*} referentiel
 * @returns
 */
export const countEtpNew = (etpAffected, referentiel) => {
  let counterEtpTotal = 0
  let counterEtpSubTotal = 0
  let counterIndispo = 0
  let counterReelEtp = 0

  for (const key in etpAffected) {
    const { etpt, reelEtp, indispo } = etpAffected[key]

    if (referentiel.childrens !== undefined) {
      counterEtpTotal += etpt
      if (reelEtp > counterReelEtp) counterReelEtp = reelEtp
    } else {
      counterEtpSubTotal += etpt
      counterIndispo += indispo
    }
  }

  return {
    counterEtpTotal,
    counterEtpSubTotal,
    counterIndispo,
    counterReelEtp,
  }
}

/**
 * Calcule des d'ETP
 * @param {*} etpAffected
 * @param {*} referentiel
 * @returns objet d'ETP
 */
export const countEtp = (etpAffected, referentiel) => {
  let counterEtpTotal = 0
  let counterEtpSubTotal = 0
  let counterIndispo = 0
  let counterReelEtp = 0

  Object.keys(etpAffected).map((key) => {
    if (referentiel.childrens !== undefined) {
      counterEtpTotal += etpAffected[key].etpt
      counterReelEtp = counterReelEtp < etpAffected[key].reelEtp ? etpAffected[key].reelEtp : counterReelEtp
    } else {
      counterEtpSubTotal += etpAffected[key].etpt
      counterIndispo += etpAffected[key].indispo
    }
  })

  return {
    counterEtpTotal,
    counterEtpSubTotal,
    counterIndispo,
    counterReelEtp,
  }
}

/**
 * Récupère informations sur les indisponibilités
 * @param {*} referentiels
 * @returns objet d'indipos details
 */
export const getIndispoDetails = (referentiels) => {
  const refIndispo = referentiels.find((r) => r.label === 'Indisponibilité')

  const allIndispRef = []
  const idsIndispo = []
  let idsMainIndispo = undefined
  if (refIndispo) {
    idsMainIndispo = refIndispo.id
    allIndispRef.push(refIndispo)
    idsIndispo.push(refIndispo.id)
    ;(refIndispo.childrens || []).map((c) => {
      idsIndispo.push(c.id)
      allIndispRef.push(c)
    })
  }

  const allIndispRefIds = allIndispRef.map(function (obj) {
    return obj.id
  })

  return { refIndispo, allIndispRef, allIndispRefIds, idsMainIndispo }
}

/**
 * Ajout d'une ligne faisant la somme des ETP totals dans notre data set
 * @param {*} data
 * @param {*} selectedCategory
 * @returns data object
 */
export const addSumLine = (data, selectedCategory) => {
  if (selectedCategory !== 'tous' && data.length !== 0) {
    let headerSum = new Object({})
    Object.keys(data[0]).map((key) => {
      const sum = sumBy(data, key)
      headerSum[key] =
        typeof sum === 'string' || ['Numéro A-JUST', 'Ecart -> à contrôler', 'Matricule', 'TPROX', "Date d'arrivée", 'Date de départ'].includes(key) ? '' : sum
      if (key === 'Date de départ') headerSum[key] = 'SOMME'
    })
    data.push(headerSum)
  }
  return data
}

/**
 * Calcule la taille que doit faire la colonne sur excel en fonction de la taille du label de l'entête
 * @param {*} json
 * @returns object
 */
export const autofitColumns = (json, firstTab = false, len = 10) => {
  if (json && json.length !== 0) {
    const jsonKeys = Object.keys(json[0])

    let objectMaxLength = []
    for (let i = 0; i < json.length; i++) {
      let value = json[i]
      for (let j = 0; j < jsonKeys.length; j++) {
        if (typeof value[jsonKeys[j]] == 'number') {
          objectMaxLength[j] = 10
        } else {
          const l = value[jsonKeys[j]] ? value[jsonKeys[j]].length : 0
          objectMaxLength[j] = objectMaxLength[j] >= l ? objectMaxLength[j] : l
        }
      }

      let key = jsonKeys
      for (let j = 0; j < key.length; j++) {
        objectMaxLength[j] = objectMaxLength[j] >= key[j].length ? objectMaxLength[j] : key[j].length + 1.5
      }
    }

    const wscols = objectMaxLength.map((w) => {
      return { width: w }
    })

    if (firstTab)
      return wscols.map((w, index) => {
        if (index > len) return { width: 27 }
        else return { width: w.width }
      })

    return wscols
  } else return []
}

/**
 * Remplace les 0 par des _ dans un dataset
 * @param {*} data
 * @returns data set
 */
export const replaceZeroByDash = (data) => {
  for (let i = 0; i < data.length; i++) {
    Object.keys(data[i]).forEach((key) => {
      if (data[i][key] === 0) {
        data[i][key] = '-'
      }
    })
  }
  return data
}

/**
 * Retourne null si 0
 * @param {*} value
 * @returns value
 */
export const replaceIfZero = (value) => {
  return value === 0 ? null : value
}

export const computeCETDays = (indisponibilities, dateStart, dateStop) => {
  let now = new Date(dateStart)
  let nbDay = 0
  do {
    if (workingDay(now)) {
      indisponibilities.filter((hra) => {
        if (now && today(hra.dateStart).getTime() <= now.getTime()) {
          if (hra.dateStop) {
            if (today(hra.dateStop).getTime() >= now.getTime()) {
              if (hra.contentieux.label === CET_LABEL) {
                nbDay++
                return true
              }
            }
          } else {
            if (hra.contentieux.label === CET_LABEL) {
              nbDay++
              return true
            }
          }
        }
        return false
      })
    }
    now.setDate(now.getDate() + 1)
  } while (now.getTime() <= dateStop.getTime())
  return nbDay
}

/**
export const computeExtractDdgv2 = async (
  models,
  allHuman,
  flatReferentielsList,
  categories,
  categoryFilter,
  juridictionName,
  dateStart,
  dateStop,
  isJirs,
  signal = null,
) => {
  let onglet2 = []
  const start = setTimeToMidDay(dateStart)
  const stop = setTimeToMidDay(dateStop)
  const totalPeriodDays = nbOfDays(start, stop)
  const { allIndispRefIds, refIndispo } = getIndispoDetails(flatReferentielsList)
  const baseAbsLabels = [...ABSENTEISME_LABELS]

  console.time('extractor-5.2ddgbis')

  const isIndispoReferentiel = (referentiel) => allIndispRefIds.includes(referentiel.id)

  for (const human of allHuman) {
    checkAbort(signal)
    const { currentSituation } = findSituation(human, undefined, signal)
    const categoryName = currentSituation?.category?.label || 'pas de catégorie'
    const fonctionName = currentSituation?.fonction?.code || 'pas de fonction'
    const fonctionCategory = currentSituation?.fonction?.category_detail || ''

    const refObj = { ...emptyRefObj(flatReferentielsList) }
    const absLabels = [...baseAbsLabels]

    const nbGlobalDaysCET = computeCETDays(human.indisponibilities, start, stop)
    if (nbGlobalDaysCET < 30) absLabels.push(CET_LABEL)

    let totalEtpt = 0,
      reelEtp = 0,
      absenteisme = 0,
      totalDaysGone = 0,
      totalDays = 0

    const indispoResults = await Promise.all(
      flatReferentielsList.map(async (referentiel) => {
        checkAbort(signal)
        const hasReferentiel =
          (human.situations || []).some((s) => (s.activities || []).some((a) => a.contentieux.id === referentiel.id)) ||
          (human.indisponibilities || []).some((ind) => ind.contentieux.id === referentiel.id)
        if (!hasReferentiel) return { indispo: 0 }

        const etpAffected = await getHRVentilation(human, referentiel.id, [...categories], start, stop, true, absLabels, signal)

        const { counterEtpTotal, counterEtpSubTotal, counterIndispo, counterReelEtp } = await countEtp(etpAffected, referentiel)

        Object.values(etpAffected).forEach(({ nbDaysGone, nbDay }) => {
          if (!totalDaysGone && nbDaysGone) totalDaysGone = nbDaysGone
          if (!totalDays && nbDay) totalDays = nbDay
        })

        if (!reelEtp) reelEtp = counterReelEtp

        const label = getExcelLabel(referentiel, referentiel.childrens && !isIndispoReferentiel(referentiel))

        if (referentiel.childrens && !isIndispoReferentiel(referentiel)) {
          refObj[label] = counterEtpTotal
          totalEtpt += counterEtpTotal
        } else {
          if (isIndispoReferentiel(referentiel)) {
            const value = counterIndispo / 100
            refObj[label] = value
            if (referentiel.label === CET_LABEL) refObj[label] = value
            if (absLabels.includes(referentiel.label)) absenteisme += value
            return { indispo: value }
          } else {
            refObj[label] = counterEtpSubTotal
          }
        }
        return { indispo: 0 }
      }),
    )

    const indispoTotal = sumBy(indispoResults, 'indispo')
    refObj[getExcelLabel(refIndispo, true)] = indispoTotal

    if (!reelEtp) {
      const reelEtpObject = buildReelEtp(human, start, stop)
      const sumEtp = sumBy(reelEtpObject, 'etp')
      const sumDays = sumBy(reelEtpObject, 'countNbOfDays')
      const refKey = refObj[getExcelLabel(refIndispo, true)] || 0

      reelEtp = computeFinalReelEtp(human, start, stop, sumEtp, sumDays, refKey, totalDays, totalPeriodDays)
    }

    if (isCa()) {
      Object.keys(refObj).forEach((k) => {
        if (k.includes(DELEGATION_TJ.toUpperCase())) refObj[getExcelLabel(refIndispo, true)] -= refObj[k]
      })
    }

    ;['14.2. COMPTE ÉPARGNE TEMPS', '12.2. COMPTE ÉPARGNE TEMPS'].forEach((key) => delete refObj[key])

    const { absenteismeDetails, delegation } = handleAbsenteisme(refObj, isCa(), isTj())

    if (categoryFilter.includes(categoryName.toLowerCase())) {
      const jurLabel = (human.juridiction || juridictionName.label).replaceAll('TPR ', 'TPRX ').toUpperCase()
      onglet2.push(
        buildOnglet2Entry(
          human,
          categoryName,
          fonctionName,
          fonctionCategory,
          reelEtp,
          refObj,
          jurLabel,
          isJirs,
          absenteismeDetails,
          delegation,
          dateStart,
          dateStop,
        ),
      )
    }
  }

  console.timeEnd('extractor-5.2ddgbis')
  console.log(onglet2.length)

  onglet2 = orderBy(onglet2, ['Catégorie', 'Nom', 'Prénom', 'Matricule'], ['desc', 'asc', 'asc', 'asc'])

  return onglet2
}
 */

const buildOnglet2Entry = (
  human,
  categoryName,
  fonctionName,
  fonctionCategory,
  reelEtp,
  refObj,
  jurLabel,
  isJirs,
  absenteismeDetails,
  delegation,
  dateStart,
  dateStop,
) => {
  const round4 = (val) => Math.round((val + Number.EPSILON) * 10000) / 10000

  const nbGlobalDaysCET = computeCETDays(human.indisponibilities, setTimeToMidDay(dateStart), setTimeToMidDay(dateStop))

  // CET keys à exclure manuellement AVANT la somme
  const refObjFiltered = { ...refObj }
  delete refObjFiltered['14.2. COMPTE ÉPARGNE TEMPS']
  delete refObjFiltered['12.2. COMPTE ÉPARGNE TEMPS']

  const CETTotalEtp = refObj['14.2. COMPTE ÉPARGNE TEMPS'] || refObj['12.2. COMPTE ÉPARGNE TEMPS'] || 0

  const tempsVentiles = round4(sumBy(Object.values(refObjFiltered), (v) => Number(v || 0)))

  const ecartVentilation = round4(reelEtp - tempsVentiles)

  const gaps = isCa()
    ? {
        ['Ecart CTX MINEURS → détails manquants, à rajouter dans A-JUST']: null,
        ['___']: null,
      }
    : isTj()
      ? {
          ['Ecart JE → détails manquants, à rajouter dans A-JUST']: null,
          ['Ecart JI → détails manquants, à rajouter dans A-JUST']: null,
        }
      : null

  return {
    ['Réf.']: String(human.id),
    Arrondissement: jurLabel,
    Jirs: isJirs ? 'x' : '',
    Juridiction: jurLabel,
    Nom: human.lastName,
    Prénom: human.firstName,
    Matricule: human.matricule,
    Catégorie: categoryName,
    Fonction: fonctionName,
    ['Fonction recodée']: null,
    ['Code fonction par défaut']: fonctionCategory,
    ['Fonction agrégat']: null,
    ['TJCPH']: null,
    ["Date d'arrivée"]: human.dateStart ? setTimeToMidDay(human.dateStart).toISOString().split('T')[0] : null,
    ['Date de départ']: human.dateEnd ? setTimeToMidDay(human.dateEnd).toISOString().split('T')[0] : null,
    ['ETPT sur la période absentéisme non déduit (hors action 99)']: reelEtp < 0.0001 ? 0 : round4(reelEtp),
    ['Temps ventilés sur la période (hors action 99)']: tempsVentiles,
    ['Ecart → ventilations manquantes dans A-JUST']: ecartVentilation > 0.0001 ? ecartVentilation : '-',
    ...gaps,
    ...refObjFiltered,
    ['CET > 30 jours']: nbGlobalDaysCET >= 30 ? CETTotalEtp : 0,
    ['CET < 30 jours']: nbGlobalDaysCET < 30 ? CETTotalEtp : 0,
    ...absenteismeDetails,
    ['TOTAL absentéisme réintégré (CMO + Congé maternité + Autre absentéisme  + CET < 30 jours)']: Object.entries(refObjFiltered)
      .filter(([key]) => key.toLowerCase().includes('absent'))
      .reduce((acc, [, v]) => acc + (v || 0), 0),
    ...(isCa() ? delegation : {}),
  }
}

export const buildReelEtp = (human, dateStart, dateStop) => {
  const start = setTimeToMidDay(dateStart)
  const stop = setTimeToMidDay(dateStop)

  return (human.situations || []).flatMap((situation) => {
    const from = setTimeToMidDay(situation.start)
    const to = setTimeToMidDay(situation.end || dateStop)

    if (to < start || from > stop) return []

    const overlapStart = from < start ? start : from
    const overlapEnd = to > stop ? stop : to
    const nbDays = nbOfDays(overlapStart, overlapEnd)

    return {
      etp: situation.etp ?? 0,
      countNbOfDays: nbDays,
    }
  })
}

export const computeFinalReelEtp = (human, dateStart, dateStop, sumEtp, sumDays, refKey, totalDays, totalPeriodDays) => {
  // Si aucun jour mesuré, retourner 0 pour éviter une division par 0
  if (sumDays === 0 || totalPeriodDays === 0) return 0

  // Ratio des jours d'activité réels sur la période complète
  const ratio = totalDays > 0 ? sumDays / totalDays : 1

  // Calcul final de l’ETP en pondérant selon le ratio d'activité
  const etp = (sumEtp + refKey) / totalPeriodDays

  return Math.round(etp * ratio * 1000) / 1000
}

export const handleAbsenteisme = (refObj, isCa, isTj) => {
  const absenteismeDetails = {}
  const delegation = {}

  Object.entries(refObj).forEach(([key, value]) => {
    if (!value) return

    const lowerKey = key.toLowerCase()

    if (lowerKey.includes('congé maternité')) {
      absenteismeDetails['Congé maternité'] = value
    } else if (lowerKey.includes('cmo')) {
      absenteismeDetails['CMO'] = value
    } else if (lowerKey.includes('autre absentéisme')) {
      absenteismeDetails['Autre absentéisme'] = value
    } else if (lowerKey.includes('cet < 30 jours')) {
      absenteismeDetails['CET < 30 jours'] = value
    }

    if (isCa && lowerKey.includes('délégation tj')) {
      delegation[key] = value
    }

    if (isTj && lowerKey.includes('délégation parquet')) {
      delegation[key] = value
    }
  })

  return { absenteismeDetails, delegation }
}

import pLimit from 'p-limit'

export const computeExtractDdgv5 = async (
  models,
  allHuman,
  flatReferentielsList,
  categories,
  categoryFilter,
  juridictionName,
  dateStart,
  dateStop,
  isJirs,
  signal = null,
) => {
  let onglet2 = []
  const limit = pLimit(10)

  dateStart = setTimeToMidDay(dateStart)
  dateStop = setTimeToMidDay(dateStop)

  console.time('extractor-5.2')

  const processHuman = async (human) => {
    checkAbort(signal)
    const { currentSituation } = findSituation(human, undefined, signal)

    let categoryName = currentSituation && currentSituation.category && currentSituation.category.label ? currentSituation.category.label : 'pas de catégorie'
    let fonctionName = currentSituation && currentSituation.fonction && currentSituation.fonction.code ? currentSituation.fonction.code : 'pas de fonction'
    let fonctionCategory =
      currentSituation && currentSituation.fonction && currentSituation.fonction.category_detail ? currentSituation.fonction.category_detail : ''

    let refObj = { ...emptyRefObj(flatReferentielsList) }
    let totalEtpt = 0
    let reelEtp = 0
    let absenteisme = 0
    let totalDaysGone = 0
    let totalDays = 0
    let indispoArray = new Array([])
    let { allIndispRefIds, refIndispo } = getIndispoDetails(flatReferentielsList)

    let CETTotalEtp = 0
    let nbGlobalDaysCET = 0

    let nbCETDays = 0
    let absLabels = [...ABSENTEISME_LABELS]

    nbCETDays = computeCETDays(human.indisponibilities, dateStart, dateStop)
    nbGlobalDaysCET = nbCETDays

    if (nbGlobalDaysCET < 30) absLabels.push(CET_LABEL)

    indispoArray = [
      ...(await Promise.all(
        flatReferentielsList.map(async (referentiel) => {
          checkAbort(signal)
          const situations = human.situations || []
          const indisponibilities = human.indisponibilities || []

          if (
            situations.some((s) => {
              const activities = s.activities || []
              return activities.some((a) => a.contentieux.id === referentiel.id)
            }) ||
            indisponibilities.some((indisponibility) => {
              return indisponibility.contentieux.id === referentiel.id
            })
          ) {
            const etpAffected = getHRVentilation(human, referentiel.id, [...categories], dateStart, dateStop, true, absLabels, signal)

            const { counterEtpTotal, counterEtpSubTotal, counterIndispo, counterReelEtp } = {
              ...(await countEtp({ ...etpAffected }, referentiel)),
            }

            checkAbort(signal)

            Object.keys(etpAffected).map((key) => {
              totalDaysGone = totalDaysGone === 0 && etpAffected[key].nbDaysGone > 0 ? etpAffected[key].nbDaysGone : totalDaysGone
              totalDays = totalDays === 0 && etpAffected[key].nbDay > 0 ? etpAffected[key].nbDay : totalDays
            })

            reelEtp = reelEtp === 0 ? counterReelEtp : reelEtp

            const isIndispoRef = await allIndispRefIds.includes(referentiel.id)

            if (referentiel.childrens !== undefined && !isIndispoRef) {
              const label = getExcelLabel(referentiel, true)
              refObj[label] = counterEtpTotal
              totalEtpt += counterEtpTotal
            } else {
              const label = getExcelLabel(referentiel, false)
              if (isIndispoRef) {
                refObj[label] = counterIndispo / 100
                if (referentiel.label === CET_LABEL) CETTotalEtp = refObj[label]
                if (absLabels.includes(referentiel.label)) absenteisme += refObj[label]
                else
                  return {
                    indispo: counterIndispo / 100,
                  }
              } else {
                refObj[label] = counterEtpSubTotal
              }
            }
          }
          return { indispo: 0 }
        }),
      )),
    ]

    const key = getExcelLabel(refIndispo, true)

    refObj[key] = sumBy(indispoArray, 'indispo')

    if (reelEtp === 0) {
      let reelEtpObject = []

      sortBy(human.situations, 'dateStart', 'asc').map((situation, index) => {
        let nextDateStart = situation.dateStart <= dateStart ? dateStart : situation.dateStart
        nextDateStart = nextDateStart <= dateStop ? nextDateStart : null
        const middleDate = human.situations[index].dateStart <= dateStop ? today(human.situations[index].dateStart) : null
        const nextEndDate = middleDate && index < human.situations.length - 1 ? middleDate : dateStop
        let countNbOfDays = undefined
        let countNbOfDaysGone = 0
        if (nextDateStart && nextEndDate && today(nextDateStart) < today(nextEndDate)) {
          countNbOfDays = nbWorkingDays(today(nextDateStart), today(nextEndDate))
        }
        if (human.dateEnd && getNextDay(human.dateEnd) <= nextEndDate) {
          countNbOfDaysGone = nbWorkingDays(today(getNextDay(human.dateEnd)), today(nextEndDate))
        }
        if (typeof countNbOfDays === 'number' && nextDateStart <= nextEndDate) {
          reelEtpObject.push({
            etp: situation.etp * (countNbOfDays - countNbOfDaysGone),
            countNbOfDays: countNbOfDays - countNbOfDaysGone,
          })
        }
      })

      const isGone = dateStop > human.dateEnd && human.dateEnd > dateStart
      const hasArrived = dateStart < human.dateStart && human.dateStart < dateStop

      if (human.dateEnd && isGone && hasArrived && dateStart) {
        reelEtp =
          ((sumBy(reelEtpObject, 'etp') / sumBy(reelEtpObject, 'countNbOfDays') - ((refObj[key] || 0) * totalDays) / sumBy(reelEtpObject, 'countNbOfDays')) *
            nbOfDays(human.dateStart, human.dateEnd)) /
          nbOfDays(dateStart, dateStop)
      } else if (human.dateEnd && isGone) {
        reelEtp =
          ((sumBy(reelEtpObject, 'etp') / sumBy(reelEtpObject, 'countNbOfDays') - ((refObj[key] || 0) * totalDays) / sumBy(reelEtpObject, 'countNbOfDays')) *
            nbOfDays(dateStart, human.dateEnd)) /
          nbOfDays(dateStart, dateStop)
      } else if (hasArrived && dateStart) {
        reelEtp =
          ((sumBy(reelEtpObject, 'etp') / sumBy(reelEtpObject, 'countNbOfDays') - ((refObj[key] || 0) * totalDays) / sumBy(reelEtpObject, 'countNbOfDays')) *
            nbOfDays(human.dateStart, dateStop)) /
          nbOfDays(dateStart, dateStop)
      } else {
        reelEtp = sumBy(reelEtpObject, 'etp') / sumBy(reelEtpObject, 'countNbOfDays') - ((refObj[key] || 0) * totalDays) / sumBy(reelEtpObject, 'countNbOfDays')
      }
    }

    if (isCa()) {
      Object.keys(refObj).map((k) => {
        if (k.includes(DELEGATION_TJ.toUpperCase())) refObj[key] = refObj[key] - refObj[k]
      })
    }

    ;['14.2. COMPTE ÉPARGNE TEMPS', '12.2. COMPTE ÉPARGNE TEMPS'].forEach((cle) => {
      if (refObj.hasOwnProperty(cle)) {
        delete refObj[cle]
      }
    })

    let absenteismeDetails = null
    let delegation = null
    if (isCa()) {
      ;({ refObj, delegation } = getAndDeleteAbsenteisme(refObj, ['14.13. DÉLÉGATION TJ'], true))
      ;({ refObj, absenteismeDetails } = getAndDeleteAbsenteisme(refObj, [
        '14.4. CONGÉ MALADIE ORDINAIRE',
        '14.5. CONGÉ MATERNITÉ/PATERNITÉ/ADOPTION',
        '14.14. AUTRE ABSENTÉISME',
      ]))
    }
    if (isTj()) {
      ;({ refObj, absenteismeDetails } = getAndDeleteAbsenteisme(refObj, [
        '12.31. CONGÉ MALADIE ORDINAIRE',
        '12.32. CONGÉ MATERNITÉ/PATERNITÉ/ADOPTION',
        '12.8. AUTRE ABSENTÉISME',
      ]))
    }

    if (categoryFilter.includes(categoryName.toLowerCase()))
      if (categoryName !== 'pas de catégorie' || fonctionName !== 'pas de fonction') {
        if (human.juridiction && human.juridiction.length !== 0) human.juridiction = human.juridiction.replaceAll('TPR ', 'TPRX ')

        let gaps = null
        if (isCa()) {
          gaps = {
            ['Ecart CTX MINEURS → détails manquants, à rajouter dans A-JUST']: null,
            ['___']: null,
          }
        }
        if (isTj()) {
          gaps = {
            ['Ecart JE → détails manquants, à rajouter dans A-JUST']: null,
            ['Ecart JI → détails manquants, à rajouter dans A-JUST']: null,
          }
        }
        onglet2.push({
          ['Réf.']: String(human.id),
          Arrondissement: juridictionName.label,
          Jirs: isJirs ? 'x' : '',
          Juridiction: (human.juridiction || juridictionName.label).toUpperCase(),
          Nom: human.lastName,
          Prénom: human.firstName,
          Matricule: human.matricule,
          Catégorie: categoryName,
          Fonction: fonctionName,
          ['Fonction recodée']: null,
          ['Code fonction par défaut']: fonctionCategory,
          ['Fonction agrégat']: null,
          ['TJCPH']: null,
          ["Date d'arrivée"]: human.dateStart === null ? null : setTimeToMidDay(human.dateStart).toISOString().split('T')[0],
          ['Date de départ']: human.dateEnd === null ? null : setTimeToMidDay(human.dateEnd).toISOString().split('T')[0],
          ['ETPT sur la période absentéisme non déduit (hors action 99)']: reelEtp < 0.0001 ? 0 : reelEtp,
          ['Temps ventilés sur la période (hors action 99)']: totalEtpt,
          ['Ecart → ventilations manquantes dans A-JUST']: reelEtp - totalEtpt > 0.0001 ? reelEtp - totalEtpt : '-',
          ...gaps,
          ...refObj,
          ['CET > 30 jours']: nbGlobalDaysCET >= 30 ? CETTotalEtp : 0,
          ['CET < 30 jours']: nbGlobalDaysCET < 30 ? CETTotalEtp : 0,
          ...absenteismeDetails,
          ['TOTAL absentéisme réintégré (CMO + Congé maternité + Autre absentéisme  + CET < 30 jours)']: absenteisme,
          ...(isCa() ? delegation : {}),
        })
      }
  }

  await Promise.all(allHuman.map((human) => limit(() => processHuman(human))))

  console.timeEnd('extractor-5.2')

  onglet2 = orderBy(onglet2, ['Catégorie', 'Nom', 'Prénom', 'Matricule'], ['desc', 'asc', 'asc', 'asc'])

  return onglet2
}

export const computeExtractDdg = async (
  models,
  allHuman,
  flatReferentielsList,
  categories,
  categoryFilter,
  juridictionName,
  dateStart,
  dateStop,
  isJirs,
  signal = null,
) => {
  let onglet2 = []
  dateStart = setTimeToMidDay(dateStart)
  dateStop = setTimeToMidDay(dateStop)
  let { allIndispRefIds, refIndispo } = getIndispoDetails(flatReferentielsList)

  console.time('extractor-5.2')
  await Promise.all(
    allHuman.map(async (human) => {
      const { currentSituation } = findSituation(human, undefined, signal)

      let categoryName = currentSituation && currentSituation.category && currentSituation.category.label ? currentSituation.category.label : 'pas de catégorie'
      let fonctionName = currentSituation && currentSituation.fonction && currentSituation.fonction.code ? currentSituation.fonction.code : 'pas de fonction'
      let fonctionCategory =
        currentSituation && currentSituation.fonction && currentSituation.fonction.category_detail ? currentSituation.fonction.category_detail : ''

      let refObj = { ...emptyRefObj(flatReferentielsList) }
      let totalEtpt = 0
      let reelEtp = 0
      let absenteisme = 0
      let totalDaysGone = 0
      let totalDays = 0
      let indispoArray = new Array([])

      let CETTotalEtp = 0
      let nbGlobalDaysCET = 0

      let nbCETDays = 0
      let absLabels = [...ABSENTEISME_LABELS]

      dateStart = setTimeToMidDay(dateStart)
      dateStop = setTimeToMidDay(dateStop)

      nbCETDays = computeCETDays(human.indisponibilities, dateStart, dateStop)
      nbGlobalDaysCET = nbCETDays

      if (nbGlobalDaysCET < 30) absLabels.push(CET_LABEL)

      indispoArray = [
        ...(await Promise.all(
          flatReferentielsList.map(async (referentiel) => {
            const situations = human.situations || []
            const indisponibilities = human.indisponibilities || []

            if (
              situations.some((s) => {
                const activities = s.activities || []
                return activities.some((a) => a.contentieux.id === referentiel.id)
              }) ||
              indisponibilities.some((indisponibility) => {
                return indisponibility.contentieux.id === referentiel.id
              })
            ) {
              const etpAffected = getHRVentilation(human, referentiel.id, [...categories], dateStart, dateStop, true, absLabels, signal)

              const { counterEtpTotal, counterEtpSubTotal, counterIndispo, counterReelEtp } = {
                ...(await countEtp({ ...etpAffected }, referentiel)),
              }

              Object.keys(etpAffected).map((key) => {
                totalDaysGone = totalDaysGone === 0 && etpAffected[key].nbDaysGone > 0 ? etpAffected[key].nbDaysGone : totalDaysGone
                totalDays = totalDays === 0 && etpAffected[key].nbDay > 0 ? etpAffected[key].nbDay : totalDays
              })

              reelEtp = reelEtp === 0 ? counterReelEtp : reelEtp

              const isIndispoRef = await allIndispRefIds.includes(referentiel.id)

              if (referentiel.childrens !== undefined && !isIndispoRef) {
                const label = getExcelLabel(referentiel, true)
                refObj[label] = counterEtpTotal
                totalEtpt += counterEtpTotal
              } else {
                const label = getExcelLabel(referentiel, false)
                if (isIndispoRef) {
                  refObj[label] = counterIndispo / 100
                  if (referentiel.label === CET_LABEL) CETTotalEtp = refObj[label]
                  if (absLabels.includes(referentiel.label)) absenteisme += refObj[label]
                  else
                    return {
                      indispo: counterIndispo / 100,
                    }
                } else {
                  refObj[label] = counterEtpSubTotal
                }
              }
            }
            return { indispo: 0 }
          }),
        )),
      ]

      const key = getExcelLabel(refIndispo, true)

      refObj[key] = sumBy(indispoArray, 'indispo')

      if (reelEtp === 0) {
        let reelEtpObject = []

        sortBy(human.situations, 'dateStart', 'asc').map((situation, index) => {
          let nextDateStart = situation.dateStart <= dateStart ? dateStart : situation.dateStart
          nextDateStart = nextDateStart <= dateStop ? nextDateStart : null
          const middleDate = human.situations[index].dateStart <= dateStop ? today(human.situations[index].dateStart) : null
          const nextEndDate = middleDate && index < human.situations.length - 1 ? middleDate : dateStop
          let countNbOfDays = undefined
          let countNbOfDaysGone = 0
          if (nextDateStart && nextEndDate && today(nextDateStart) < today(nextEndDate)) {
            countNbOfDays = nbWorkingDays(today(nextDateStart), today(nextEndDate))
          }
          if (human.dateEnd && getNextDay(human.dateEnd) <= nextEndDate) {
            countNbOfDaysGone = nbWorkingDays(today(getNextDay(human.dateEnd)), today(nextEndDate))
          }
          if (typeof countNbOfDays === 'number' && nextDateStart <= nextEndDate) {
            reelEtpObject.push({
              etp: situation.etp * (countNbOfDays - countNbOfDaysGone),
              countNbOfDays: countNbOfDays - countNbOfDaysGone,
            })
          }
        })

        const isGone = dateStop > human.dateEnd && human.dateEnd > dateStart
        const hasArrived = dateStart < human.dateStart && human.dateStart < dateStop

        if (human.dateEnd && isGone && hasArrived && dateStart) {
          reelEtp =
            ((sumBy(reelEtpObject, 'etp') / sumBy(reelEtpObject, 'countNbOfDays') - ((refObj[key] || 0) * totalDays) / sumBy(reelEtpObject, 'countNbOfDays')) *
              nbOfDays(human.dateStart, human.dateEnd)) /
            nbOfDays(dateStart, dateStop)
        } else if (human.dateEnd && isGone) {
          reelEtp =
            ((sumBy(reelEtpObject, 'etp') / sumBy(reelEtpObject, 'countNbOfDays') - ((refObj[key] || 0) * totalDays) / sumBy(reelEtpObject, 'countNbOfDays')) *
              nbOfDays(dateStart, human.dateEnd)) /
            nbOfDays(dateStart, dateStop)
        } else if (hasArrived && dateStart) {
          reelEtp =
            ((sumBy(reelEtpObject, 'etp') / sumBy(reelEtpObject, 'countNbOfDays') - ((refObj[key] || 0) * totalDays) / sumBy(reelEtpObject, 'countNbOfDays')) *
              nbOfDays(human.dateStart, dateStop)) /
            nbOfDays(dateStart, dateStop)
        } else {
          reelEtp =
            sumBy(reelEtpObject, 'etp') / sumBy(reelEtpObject, 'countNbOfDays') - ((refObj[key] || 0) * totalDays) / sumBy(reelEtpObject, 'countNbOfDays')
        }
      }

      if (isCa()) {
        Object.keys(refObj).map((k) => {
          if (k.includes(DELEGATION_TJ.toUpperCase())) refObj[key] = refObj[key] - refObj[k]
        })
      }

      ;['14.2. COMPTE ÉPARGNE TEMPS', '12.2. COMPTE ÉPARGNE TEMPS'].forEach((cle) => {
        if (refObj.hasOwnProperty(cle)) {
          delete refObj[cle]
        }
      })

      let absenteismeDetails = null
      let delegation = null
      if (isCa()) {
        ;({ refObj, delegation } = getAndDeleteAbsenteisme(refObj, ['14.13. DÉLÉGATION TJ'], true))
        ;({ refObj, absenteismeDetails } = getAndDeleteAbsenteisme(refObj, [
          '14.4. CONGÉ MALADIE ORDINAIRE',
          '14.5. CONGÉ MATERNITÉ/PATERNITÉ/ADOPTION',
          '14.14. AUTRE ABSENTÉISME',
        ]))
      }
      if (isTj()) {
        ;({ refObj, absenteismeDetails } = getAndDeleteAbsenteisme(refObj, [
          '12.31. CONGÉ MALADIE ORDINAIRE',
          '12.32. CONGÉ MATERNITÉ/PATERNITÉ/ADOPTION',
          '12.8. AUTRE ABSENTÉISME',
        ]))
      }

      if (categoryFilter.includes(categoryName.toLowerCase()))
        if (categoryName !== 'pas de catégorie' || fonctionName !== 'pas de fonction') {
          if (human.juridiction && human.juridiction.length !== 0) human.juridiction = human.juridiction.replaceAll('TPR ', 'TPRX ')

          let gaps = null
          if (isCa()) {
            gaps = {
              ['Ecart CTX MINEURS → détails manquants, à rajouter dans A-JUST']: null,
              ['___']: null,
            }
          }
          if (isTj()) {
            gaps = {
              ['Ecart JE → détails manquants, à rajouter dans A-JUST']: null,
              ['Ecart JI → détails manquants, à rajouter dans A-JUST']: null,
            }
          }
          onglet2.push({
            ['Réf.']: String(human.id),
            Arrondissement: juridictionName.label,
            Jirs: isJirs ? 'x' : '',
            Juridiction: (human.juridiction || juridictionName.label).toUpperCase(),
            Nom: human.lastName,
            Prénom: human.firstName,
            Matricule: human.matricule,
            Catégorie: categoryName,
            Fonction: fonctionName,
            ['Fonction recodée']: null,
            ['Code fonction par défaut']: fonctionCategory,
            ['Fonction agrégat']: null,
            ['TJCPH']: null,
            ["Date d'arrivée"]: human.dateStart === null ? null : setTimeToMidDay(human.dateStart).toISOString().split('T')[0],
            ['Date de départ']: human.dateEnd === null ? null : setTimeToMidDay(human.dateEnd).toISOString().split('T')[0],
            ['ETPT sur la période absentéisme non déduit (hors action 99)']: reelEtp < 0.0001 ? 0 : reelEtp,
            ['Temps ventilés sur la période (hors action 99)']: totalEtpt,
            ['Ecart → ventilations manquantes dans A-JUST']: reelEtp - totalEtpt > 0.0001 ? reelEtp - totalEtpt : '-',
            ...gaps,
            ...refObj,
            ['CET > 30 jours']: nbGlobalDaysCET >= 30 ? CETTotalEtp : 0,
            ['CET < 30 jours']: nbGlobalDaysCET < 30 ? CETTotalEtp : 0,
            ...absenteismeDetails,
            ['TOTAL absentéisme réintégré (CMO + Congé maternité + Autre absentéisme  + CET < 30 jours)']: absenteisme,
            ...(isCa() ? delegation : {}),
          })
        }
    }),
  )
  console.timeEnd('extractor-5.2')

  onglet2 = orderBy(onglet2, ['Catégorie', 'Nom', 'Prénom', 'Matricule'], ['desc', 'asc', 'asc', 'asc'])

  return onglet2
}

export const getViewModel = async (params) => {
  const keys1 = params.onglet1.values != null && params.onglet1.values.length ? Object.keys(params.onglet1.values[0]) : []
  let keys2 = params.onglet2.values != null && params.onglet2.values.length ? Object.keys(params.onglet2.values[0]) : []

  if (isCa()) {
    keys2 = keys2.map((x) => (x === '14. TOTAL INDISPONIBILITÉ' ? "14. TOTAL des INDISPONIBILITÉS relevant de l'action 99" : x))

    keys2 = keys2.filter((x) => !['14.2. COMPTE ÉPARGNE TEMPS', '12.2. COMPTE ÉPARGNE TEMPS'].includes(x))
  } else {
    keys2 = keys2.map((x) => (x === '12. TOTAL INDISPONIBILITÉ' ? "12. TOTAL des INDISPONIBILITÉS relevant de l'action 99" : x))
  }

  const tgilist = [...params.allJuridiction].filter((x) => x.type === 'TGI').map((x) => x.tprox)
  const tpxlist = [...params.allJuridiction].filter((x) => x.type === 'TPRX').map((x) => x.tprox)
  const cphlist = [...params.allJuridiction].filter((x) => x.type === 'CPH').map((x) => x.tprox)

  let uniqueJur = await sortBy(params.tproxs, 'tprox').map((t) => t.tprox)
  const uniqueCity = uniqueJur.map((x) => {
    const [first, rest] = x.split(/\s+(.*)/)
    return rest
  })
  const isolatedCPH = cphlist.filter((x) => {
    const [first, rest] = x.split(/\s+(.*)/)
    if (rest.length && uniqueCity.includes(rest)) return false
    else return true
  })
  uniqueJur = [...uniqueJur, ...isolatedCPH]
  const uniqueJurIndex = await uniqueJur.map((value, index) => [value, index])
  const tProximite = ['"' + (await uniqueJur.join(',').replaceAll("'", '').replaceAll('(', '').replaceAll(')', '')) + '"']
  let agregat = params.onglet2.excelRef.filter((x) => !['14.2. COMPTE ÉPARGNE TEMPS', '12.2. COMPTE ÉPARGNE TEMPS'].includes(x.sub))

  agregat = agregat.map((x) => {
    if (x.sub === '14.13. DÉLÉGATION TJ' && isCa()) {
      return {
        ...x,
        global: '14.13. DÉLÉGATION TJ',
        global1: 'DÉLÉGATION TJ',
        sub: null,
        sub1: null,
      }
    }

    if (x.global === '12. TOTAL INDISPONIBILITÉ' && isTj())
      return {
        ...x,
        global: "12. TOTAL des INDISPONIBILITÉS relevant de l'action 99",
        global1: "12. TOTAL des INDISPONIBILITÉS relevant de l'action 99",
        sub1: x.sub,
      }

    if (x.global === '14. TOTAL INDISPONIBILITÉ' && isCa())
      return {
        ...x,
        global: "14. TOTAL des INDISPONIBILITÉS relevant de l'action 99",
        global1: "14. TOTAL des INDISPONIBILITÉS relevant de l'action 99",
        sub1: x.sub,
      }

    if (x.global === 'TOTAL absentéisme réintégré (CMO + Congé maternité + Autre absentéisme  + CET < 30 jours)' && isTj())
      return {
        ...x,
        global1: "13. TOTAL des INDISPONIBILITÉS relevant de l'absentéisme (réintégrés dans les valeurs des rubriques et sous-rubriques)",
        sub1: x.sub,
      }

    if (x.global === 'TOTAL absentéisme réintégré (CMO + Congé maternité + Autre absentéisme  + CET < 30 jours)' && isCa())
      return {
        ...x,
        global1: "15. TOTAL des INDISPONIBILITÉS relevant de l'absentéisme (réintégrés dans les valeurs des rubriques et sous-rubriques)",
        sub1: x.sub,
      }

    return { ...x, sub1: x.sub, global1: x.global }
  })

  const index = agregat.findIndex((item) => item.global === '14.13. DÉLÉGATION TJ')

  if (index !== -1) {
    const [element] = agregat.splice(index, 1) // Retire l'élément du tableau
    agregat.push(element) // Ajoute l'élément à la fin
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
            return y.label
          }),
        ],
      }
    }),
    arrondissement: uniqueJur[0],
    subtitles: [...Array(keys1.length > 6 ? keys1.length - 6 : 0)],
    days: keys1,
    stats: {
      ...params.onglet1.values.map((item) => {
        return { actions: Object.keys(item).map((key) => item[key]) }
      }),
    },
    subtitles1: [...Array(keys1.length > 6 ? keys2.length - 6 : 0)],
    days1: keys2,
    stats1: {
      ...params.onglet2.values.map((item) => {
        return { actions: Object.keys(item).map((key) => item[key]) }
      }),
    },
  }
}

export async function runExtractsInParallel({
  indexes,
  allHuman,
  flatReferentielsList,
  categories,
  categoryFilter,
  juridictionName,
  dateStart,
  dateStop,
  isJirs,
  signal,
  old = true,
}) {
  let [onglet1, onglet2] = await Promise.all([
    old == false
      ? computeExtractUltraPerf(
          indexes,
          cloneDeep(allHuman),
          flatReferentielsList,
          categories,
          categoryFilter,
          juridictionName,
          dateStart,
          dateStop,
          isJirs,
          signal,
        )
      : computeExtractv2(
          indexes,
          cloneDeep(allHuman),
          flatReferentielsList,
          categories,
          categoryFilter,
          juridictionName,
          dateStart,
          dateStop,
          isJirs,
          signal,
          old,
        ),
    computeExtractDdg(indexes, cloneDeep(allHuman), flatReferentielsList, categories, categoryFilter, juridictionName, dateStart, dateStop, isJirs, signal),
  ])
  //if (old)
  return { onglet1, onglet2 }
  //else return { onglet3: onglet1, onglet4: onglet2 }
}

export function buildExcelRef(flatReferentielsList) {
  const absenteismeList = []

  const formatedExcelList = flatReferentielsList
    .filter((elem) => {
      if (!ABSENTEISME_LABELS.includes(elem.label)) return true
      absenteismeList.push(elem)
      return false
    })
    .map((x) => {
      return x.childrens !== undefined ? { global: getExcelLabel(x, true), sub: null } : { global: null, sub: getExcelLabel(x, false) }
    })

  const excelRef = [
    {
      global: null,
      sub: 'ETPT sur la période absentéisme non déduit (hors action 99)',
    },
    { global: null, sub: 'Temps ventilés sur la période (hors action 99)' },
    ...formatedExcelList,
    { global: null, sub: 'CET > 30 jours' },
    {
      global: 'TOTAL absentéisme réintégré (CMO + Congé maternité + Autre absentéisme  + CET < 30 jours)',
      sub: null,
    },
    { global: null, sub: 'CET < 30 jours' },
    ...absenteismeList.map((y) => {
      return { global: null, sub: getExcelLabel(y, false) }
    }),
  ]

  return excelRef
}

export const getJuridictionData = async (models, juridictionName) => {
  const label = (juridictionName.label || '').toUpperCase()

  let tproxs = (await models.TJ.getByTj(label, {}, { type: 'TPRX' })).map((t) => ({
    id: t.id,
    tj: t.tj,
    tprox: t.tprox,
  }))

  if (tproxs.length === 0) {
    tproxs = [{ id: 0, tj: label, tprox: label }]
  }

  const allJuridiction = (await models.TJ.getByTj(label, {}, {})).map((t) => ({
    id: t.id,
    tj: t.tj,
    tprox: t.tprox,
    type: t.type,
  }))

  return { tproxs, allJuridiction }
}

export const computeExtract = async (
  models,
  allHuman,
  flatReferentielsList,
  categories,
  categoryFilter,
  juridictionName,
  dateStart,
  dateStop,
  isJirs,
  signal = null,
) => {
  let data = []

  console.time('extractor-5.1')
  await Promise.all(
    allHuman.map(async (human) => {
      checkAbort(signal)
      const { currentSituation } = findSituation(human, undefined, signal)

      let categoryName = currentSituation && currentSituation.category && currentSituation.category.label ? currentSituation.category.label : 'pas de catégorie'
      let fonctionName = currentSituation && currentSituation.fonction && currentSituation.fonction.code ? currentSituation.fonction.code : 'pas de fonction'

      let etpAffected = new Array()
      let refObj = { ...emptyRefObj(flatReferentielsList) }
      let totalEtpt = 0
      let reelEtp = 0
      let totalDaysGone = 0
      let totalDays = 0

      let indispoArray = new Array([])
      const { allIndispRefIds, refIndispo } = getIndispoDetails(flatReferentielsList)

      indispoArray = [
        ...(await Promise.all(
          flatReferentielsList.map(async (referentiel) => {
            checkAbort(signal)
            const situations = human.situations || []
            const indisponibilities = human.indisponibilities || []

            if (
              situations.some((s) => {
                const activities = s.activities || []
                return activities.some((a) => a.contentieux.id === referentiel.id)
              }) ||
              indisponibilities.some((indisponibility) => {
                return indisponibility.contentieux.id === referentiel.id
              })
            ) {
              etpAffected = getHRVentilation(human, referentiel.id, [...categories], dateStart, dateStop, undefined, undefined, signal)

              const { counterEtpTotal, counterEtpSubTotal, counterIndispo, counterReelEtp } = {
                ...(await countEtp({ ...etpAffected }, referentiel)),
              }

              checkAbort(signal)

              Object.keys(etpAffected).map((key) => {
                totalDaysGone = totalDaysGone === 0 && etpAffected[key].nbDaysGone > 0 ? etpAffected[key].nbDaysGone : totalDaysGone
                totalDays = totalDays === 0 && etpAffected[key].nbDay > 0 ? etpAffected[key].nbDay : totalDays
              })

              reelEtp = reelEtp === 0 ? counterReelEtp : reelEtp

              const isIndispoRef = await allIndispRefIds.includes(referentiel.id)

              if (referentiel.childrens !== undefined && !isIndispoRef) {
                const label = getExcelLabel(referentiel, true)
                refObj[label] = counterEtpTotal
                totalEtpt += counterEtpTotal
              } else {
                const label = getExcelLabel(referentiel, false)
                if (isIndispoRef) {
                  refObj[label] = counterIndispo / 100
                  return {
                    indispo: counterIndispo / 100,
                  }
                } else refObj[label] = counterEtpSubTotal
              }
            }
            return { indispo: 0 }
          }),
        )),
      ]

      const key = getExcelLabel(refIndispo, true)

      refObj[key] = sumBy(indispoArray, 'indispo')

      if (reelEtp === 0) {
        dateStart = setTimeToMidDay(dateStart)
        dateStop = setTimeToMidDay(dateStop)

        let reelEtpObject = []

        sortBy(human.situations, 'dateStart', 'asc').map((situation, index) => {
          let nextDateStart = situation.dateStart <= dateStart ? dateStart : situation.dateStart
          nextDateStart = nextDateStart <= dateStop ? nextDateStart : null
          const middleDate = human.situations[index].dateStart <= dateStop ? new Date(human.situations[index].dateStart) : null
          const nextEndDate = middleDate && index < human.situations.length - 1 ? middleDate : dateStop
          let countNbOfDays = undefined
          if (nextDateStart && nextEndDate) countNbOfDays = nbWorkingDays(new Date(nextDateStart), new Date(nextEndDate))
          if (typeof countNbOfDays === 'number' && nextDateStart <= nextEndDate) {
            reelEtpObject.push({
              etp: situation.etp * countNbOfDays,
              countNbOfDays: countNbOfDays,
            })
          }
        })

        const isGone = dateStop > human.dateEnd && human.dateEnd > dateStart
        const hasArrived = dateStart < human.dateStart && human.dateStart < dateStop

        if (human.dateEnd && isGone && hasArrived && dateStart) {
          reelEtp =
            ((sumBy(reelEtpObject, 'etp') / sumBy(reelEtpObject, 'countNbOfDays')) * nbOfDays(human.dateStart, human.dateEnd)) / nbOfDays(dateStart, dateStop) -
            (refObj[key] || 0)
        } else if (human.dateEnd && isGone) {
          reelEtp =
            ((sumBy(reelEtpObject, 'etp') / sumBy(reelEtpObject, 'countNbOfDays')) * nbOfDays(dateStart, human.dateEnd)) / nbOfDays(dateStart, dateStop) -
            (refObj[key] || 0)
        } else if (hasArrived && dateStart) {
          reelEtp =
            ((sumBy(reelEtpObject, 'etp') / sumBy(reelEtpObject, 'countNbOfDays')) * nbOfDays(human.dateStart, dateStop)) / nbOfDays(dateStart, dateStop) -
            (refObj[key] || 0)
        } else {
          reelEtp = sumBy(reelEtpObject, 'etp') / sumBy(reelEtpObject, 'countNbOfDays') - (refObj[key] || 0)
        }
      }

      let delegation = null

      if (isCa()) {
        Object.keys(refObj).map((k) => {
          if (k.includes(DELEGATION_TJ.toUpperCase())) refObj[key] = refObj[key] - refObj[k]
        })
        ;({ refObj, delegation } = getAndDeleteAbsenteisme(refObj, ['14.13. DÉLÉGATION TJ'], true))

        const newKey = '14.13. DÉLÉGATION TJ'
        const targetKey = '14. TOTAL INDISPONIBILITÉ'

        let result = {}

        // Parcourir les paires clé-valeur de l'objet original
        for (const [key, value] of Object.entries(refObj)) {
          if (key === targetKey) {
            // Insérer le nouvel élément avant le target
            result = { ...result, ...delegation }
          }
          result[key] = value
        }

        refObj = result
      }

      checkAbort(signal)

      if (categoryFilter.includes(categoryName.toLowerCase()))
        if (categoryName !== 'pas de catégorie' || fonctionName !== 'pas de fonction')
          data.push({
            ['Réf.']: String(human.id),
            ...(isCa() ? { Juridiction: juridictionName.label } : { Arrondissement: juridictionName.label }),
            Nom: human.lastName,
            Prénom: human.firstName,
            Matricule: human.matricule,
            Catégorie: categoryName,
            Fonction: fonctionName,
            ['Fonction recodée']: null,
            ...(isCa() ? { ['_']: null } : { ['TJCPH']: null }),
            ...(isCa() ? { ['__']: null } : { ['Juridiction']: null }),
            Jirs: isJirs ? 'x' : '',
            ["Date d'arrivée"]: human.dateStart === null ? null : setTimeToMidDay(human.dateStart).toISOString().split('T')[0],
            ['Date de départ']: human.dateEnd === null ? null : setTimeToMidDay(human.dateEnd).toISOString().split('T')[0],
            ['ETPT sur la période (absentéisme et action 99 déduits)']: reelEtp < 0.0001 ? 0 : reelEtp,
            ['Temps ventilés sur la période (absentéisme et action 99 déduits)']: totalEtpt,
            ...refObj,
            ...(isCa() ? delegation : {}),
          })
    }),
  )

  console.timeEnd('extractor-5.1')

  data = orderBy(data, ['Catégorie', 'Nom', 'Prénom', 'Matricule'], ['desc', 'asc', 'asc', 'asc'])

  return data
}

export const computeExtractv2 = async (
  indexes,
  allHuman,
  flatReferentielsList,
  categories,
  categoryFilter,
  juridictionName,
  dateStart,
  dateStop,
  isJirs,
  signal = null,
  old = true,
) => {
  console.time('extractor-5.2bis')

  const pLimit = require('p-limit')
  const limit = pLimit(10)

  const allIndispRefIds = getIndispoDetails(flatReferentielsList).allIndispRefIds
  const refIndispo = getIndispoDetails(flatReferentielsList).refIndispo

  const humanTasks = allHuman.map((human) =>
    limit(() =>
      computeHumanExtract({
        human,
        flatReferentielsList,
        categories,
        categoryFilter,
        juridictionName,
        dateStart,
        dateStop,
        isJirs,
        signal,
        allIndispRefIds,
        refIndispo,
        indexes,
        old,
      }),
    ),
  )

  let results = await Promise.all(humanTasks)

  console.timeEnd('extractor-5.2bis')

  results = results.filter(Boolean)

  results = orderBy(results, ['Catégorie', 'Nom', 'Prénom', 'Matricule'], ['desc', 'asc', 'asc', 'asc'])

  return results.filter(Boolean)
}

/**
 * Traitement pour un agent
 * @param {*} params
 * @returns
 */
async function computeHumanExtract(params) {
  const {
    human,
    flatReferentielsList,
    categories,
    categoryFilter,
    juridictionName,
    dateStart: originalDateStart,
    dateStop: originalDateStop,
    isJirs,
    signal,
    allIndispRefIds,
    refIndispo,
    indexes,
    old,
  } = params

  const dateStart = today(originalDateStart)
  const dateStop = today(originalDateStop)

  const { currentSituation } = findSituation(human, undefined, signal)

  const categoryName = currentSituation?.category?.label || 'pas de catégorie'
  const fonctionName = currentSituation?.fonction?.code || 'pas de fonction'

  let totalEtpt = 0
  let reelEtp = 0
  let totalDaysGone = 0
  let totalDays = 0

  let refObj = { ...emptyRefObj(flatReferentielsList) }

  const situations = human.situations || []
  const indisponibilities = human.indisponibilities || []

  const indispoArray = [
    ...(await Promise.all(
      flatReferentielsList.map(async (referentiel) => {
        const isUsedInSituation = situations.some((s) => (s.activities || []).some((a) => a.contentieux.id === referentiel.id))

        const isUsedInIndispo = indisponibilities.some((indisponibility) => indisponibility.contentieux.id === referentiel.id)

        if (isUsedInSituation || isUsedInIndispo) {
          const localEtpAffected = getHRVentilation(human, referentiel.id, [...categories], dateStart, dateStop, undefined, undefined, signal)
          /**: calculateETPForContentieux(
                indexes,
                {
                  start: dateStart,
                  end: dateStop,
                  category: categories,
                  fonctions: undefined,
                  contentieux: referentiel.id,
                  agent: human.id,
                },
                categories,
              ) */

          const { counterEtpTotal, counterEtpSubTotal, counterIndispo, counterReelEtp } = {
            ...(await countEtp({ ...localEtpAffected }, referentiel)),
          }

          Object.keys(localEtpAffected).forEach((key) => {
            if (totalDaysGone === 0 && localEtpAffected[key].nbDaysGone > 0) totalDaysGone = localEtpAffected[key].nbDaysGone
            if (totalDays === 0 && localEtpAffected[key].nbDay > 0) totalDays = localEtpAffected[key].nbDay
          })

          reelEtp = reelEtp === 0 ? counterReelEtp : reelEtp

          const isIndispoRef = allIndispRefIds.includes(referentiel.id)

          if (referentiel.childrens !== undefined && !isIndispoRef) {
            const label = getExcelLabel(referentiel, true)
            refObj[label] = counterEtpTotal
            totalEtpt += counterEtpTotal
          } else {
            const label = getExcelLabel(referentiel, false)
            if (isIndispoRef) {
              refObj[label] = counterIndispo / 100
              return {
                indispo: counterIndispo / 100,
              }
            } else {
              refObj[label] = counterEtpSubTotal
            }
          }
        }

        return { indispo: 0 }
      }),
    )),
  ]

  const key = getExcelLabel(refIndispo, true)
  refObj[key] = sumBy(indispoArray, 'indispo')

  if (reelEtp === 0) {
    let reelEtpObject = []

    sortBy(human.situations, 'dateStart', 'asc').map((situation, index) => {
      let nextDateStart = situation.dateStart <= dateStart ? dateStart : situation.dateStart
      nextDateStart = nextDateStart <= dateStop ? nextDateStart : null
      const middleDate = human.situations[index].dateStart <= dateStop ? new Date(human.situations[index].dateStart) : null
      const nextEndDate = middleDate && index < human.situations.length - 1 ? middleDate : dateStop
      let countNbOfDays = undefined
      if (nextDateStart && nextEndDate) countNbOfDays = nbWorkingDays(new Date(nextDateStart), new Date(nextEndDate))
      if (typeof countNbOfDays === 'number' && nextDateStart <= nextEndDate) {
        reelEtpObject.push({
          etp: situation.etp * countNbOfDays,
          countNbOfDays: countNbOfDays,
        })
      }
    })

    const isGone = dateStop > human.dateEnd && human.dateEnd > dateStart
    const hasArrived = dateStart < human.dateStart && human.dateStart < dateStop

    if (human.dateEnd && isGone && hasArrived && dateStart) {
      reelEtp =
        ((sumBy(reelEtpObject, 'etp') / sumBy(reelEtpObject, 'countNbOfDays')) * nbOfDays(human.dateStart, human.dateEnd)) / nbOfDays(dateStart, dateStop) -
        (refObj[key] || 0)
    } else if (human.dateEnd && isGone) {
      reelEtp =
        ((sumBy(reelEtpObject, 'etp') / sumBy(reelEtpObject, 'countNbOfDays')) * nbOfDays(dateStart, human.dateEnd)) / nbOfDays(dateStart, dateStop) -
        (refObj[key] || 0)
    } else if (hasArrived && dateStart) {
      reelEtp =
        ((sumBy(reelEtpObject, 'etp') / sumBy(reelEtpObject, 'countNbOfDays')) * nbOfDays(human.dateStart, dateStop)) / nbOfDays(dateStart, dateStop) -
        (refObj[key] || 0)
    } else {
      reelEtp = sumBy(reelEtpObject, 'etp') / sumBy(reelEtpObject, 'countNbOfDays') - (refObj[key] || 0)
    }
  }

  let delegation = null
  if (isCa()) {
    Object.keys(refObj).forEach((k) => {
      if (k.includes(DELEGATION_TJ.toUpperCase())) refObj[key] -= refObj[k]
    })
    ;({ refObj, delegation } = getAndDeleteAbsenteisme(refObj, ['14.13. DÉLÉGATION TJ'], true))
    const newKey = '14.13. DÉLÉGATION TJ'
    const targetKey = '14. TOTAL INDISPONIBILITÉ'

    const result = {}
    for (const [k, v] of Object.entries(refObj)) {
      if (k === targetKey) Object.assign(result, delegation)
      result[k] = v
    }
    refObj = result
  }

  if (!categoryFilter.includes(categoryName.toLowerCase())) return null
  if (categoryName === 'pas de catégorie' && fonctionName === 'pas de fonction') return null

  return {
    ['Réf.']: String(human.id),
    ...(isCa() ? { Juridiction: juridictionName.label } : { Arrondissement: juridictionName.label }),
    Nom: human.lastName,
    Prénom: human.firstName,
    Matricule: human.matricule,
    Catégorie: categoryName,
    Fonction: fonctionName,
    ['Fonction recodée']: null,
    ...(isCa() ? { ['_']: null } : { TJCPH: null }),
    ...(isCa() ? { ['__']: null } : { Juridiction: null }),
    Jirs: isJirs ? 'x' : '',
    ["Date d'arrivée"]: human.dateStart === null ? null : setTimeToMidDay(human.dateStart).toISOString().split('T')[0],
    ['Date de départ']: human.dateEnd === null ? null : setTimeToMidDay(human.dateEnd).toISOString().split('T')[0],
    ['ETPT sur la période (absentéisme et action 99 déduits)']: reelEtp < 0.0001 ? 0 : reelEtp,
    ['Temps ventilés sur la période (absentéisme et action 99 déduits)']: totalEtpt,
    ...refObj,
    ...(isCa() ? delegation : {}),
  }
}

export const formatFunctions = async (functionList) => {
  let list = [...functionList, ...(isCa() ? FUNCTIONS_ONLY_FOR_DDG_EXTRACTOR_CA : FUNCTIONS_ONLY_FOR_DDG_EXTRACTOR)]
  list = list.map((fct) => {
    return { CONCAT: fct['category_label'] + fct['code'], ...fct }
  })

  return orderBy(list, ['category_label', 'rank', 'code'], ['desc', 'asc', 'asc'])
}

export const getObjectKeys = async (array) => {
  if (array.length === 0) return []
  return Object.keys(array[0])
}

export const deplacerClefALaFin = (obj, clef) => {
  if (obj.hasOwnProperty(clef)) {
    const valeur = obj[clef] // Sauvegarde la valeur
    delete obj[clef] // Supprime la clé
    obj[clef] = valeur // Réinsère la clé à la fin
  }
  return obj
}

export const getAndDeleteAbsenteisme = (obj, labels, delegation = false) => {
  let absDetails = {}
  labels.map((label) => {
    if (obj.hasOwnProperty(label)) {
      const valeur = obj[label] // Sauvegarde la valeur
      delete obj[label] // Supprime la clé
      absDetails[label] = valeur
    }
  })

  if (delegation === true) return { refObj: obj, delegation: absDetails }
  else return { refObj: obj, absenteismeDetails: absDetails }
}

// BENCHMARK

export const computeExtractUltraPerf = async (
  indexes,
  allHuman,
  flatReferentielsList,
  categories,
  categoryFilter,
  juridictionName,
  dateStart,
  dateStop,
  isJirs,
  signal = null,
) => {
  console.time('ultra-perf-extract')

  const { allIndispRefIds, refIndispo } = getIndispoDetails(flatReferentielsList)
  const start = today(dateStart)
  const stop = today(dateStop)

  const limit = require('p-limit')(10) // 10 agents en parallèle

  let results = await Promise.all(
    allHuman.map((human) =>
      limit(() =>
        processHumanExtract({
          human,
          flatReferentielsList,
          categories,
          categoryFilter,
          juridictionName,
          dateStart: start,
          dateStop: stop,
          isJirs,
          signal,
          allIndispRefIds,
          refIndispo,
          indexes,
        }),
      ),
    ),
  )

  results = orderBy(results, ['Catégorie', 'Nom', 'Prénom', 'Matricule'], ['desc', 'asc', 'asc', 'asc'])

  console.timeEnd('ultra-perf-extract')

  return results.filter(Boolean)
}

async function processHumanExtract(params) {
  const {
    human,
    flatReferentielsList,
    categories,
    categoryFilter,
    juridictionName,
    dateStart,
    dateStop,
    isJirs,
    signal,
    allIndispRefIds,
    refIndispo,
    indexes,
  } = params

  const { currentSituation } = findSituation(human, undefined, signal)
  const categoryName = currentSituation?.category?.label || 'pas de catégorie'
  const fonctionName = currentSituation?.fonction?.code || 'pas de fonction'

  if (!categoryFilter.includes(categoryName.toLowerCase())) return null
  if (categoryName === 'pas de catégorie' && fonctionName === 'pas de fonction') return null

  const { refObj, totalEtpt, reelEtp } = await computeReferentielStats(
    human,
    flatReferentielsList,
    categories,
    dateStart,
    dateStop,
    allIndispRefIds,
    refIndispo,
    signal,
    indexes,
  )

  const finalLine = formatHumanLine({
    human,
    refObj,
    reelEtp,
    totalEtpt,
    categoryName,
    fonctionName,
    juridictionName,
    isJirs,
    refIndispo,
  })

  return finalLine
}

async function computeReferentielStats(human, flatReferentielsList, categories, dateStart, dateStop, allIndispRefIds, refIndispo, signal, indexes) {
  const refObj = emptyRefObj(flatReferentielsList)
  let totalEtpt = 0
  let reelEtp = 0
  const indispoArray = []

  const situations = human.situations ?? []
  const indispos = human.indisponibilities ?? []

  for (const referentiel of flatReferentielsList) {
    const refId = referentiel.id
    const isUsed = situations.some((s) => s.activities?.some((a) => a.contentieux.id === refId)) || indispos.some((i) => i.contentieux.id === refId)

    if (!isUsed) continue

    const etpAffected = getHRVentilation(human, refId, categories, dateStart, dateStop, undefined, undefined, signal)

    const { counterEtpTotal, counterEtpSubTotal, counterIndispo, counterReelEtp } = await countEtp(etpAffected, referentiel)

    reelEtp = reelEtp || counterReelEtp

    const isIndispoRef = allIndispRefIds.includes(refId)
    const label = getExcelLabel(referentiel, !isIndispoRef && referentiel.childrens)

    if (referentiel.childrens && !isIndispoRef) {
      refObj[label] = counterEtpTotal
      totalEtpt += counterEtpTotal
    } else {
      if (isIndispoRef) {
        refObj[label] = counterIndispo / 100
        indispoArray.push({ indispo: counterIndispo / 100 })
      } else {
        refObj[label] = counterEtpSubTotal
      }
    }
  }

  const key = getExcelLabel(refIndispo, true)
  refObj[key] = sumBy(indispoArray, 'indispo')

  // recalcul reelEtp si manquant
  if (!reelEtp) {
    reelEtp = computeFallbackReelEtp(human, dateStart, dateStop, refObj[key] || 0)
  }

  return { refObj, totalEtpt, reelEtp }
}

function formatHumanLine({ human, refObj, reelEtp, totalEtpt, categoryName, fonctionName, juridictionName, isJirs, refIndispo }) {
  //const key = getExcelLabel(refIndispo, true)
  return {
    ['Réf.']: String(human.id),
    ...(isCa() ? { Juridiction: juridictionName.label } : { Arrondissement: juridictionName.label }),
    Nom: human.lastName,
    Prénom: human.firstName,
    Matricule: human.matricule,
    Catégorie: categoryName,
    Fonction: fonctionName,
    ['Fonction recodée']: null,
    ...(isCa() ? { ['_']: null } : { TJCPH: null }),
    ...(isCa() ? { ['__']: null } : { Juridiction: null }),
    Jirs: isJirs ? 'x' : '',
    ["Date d'arrivée"]: human.dateStart === null ? null : setTimeToMidDay(human.dateStart).toISOString().split('T')[0],
    ['Date de départ']: human.dateEnd === null ? null : setTimeToMidDay(human.dateEnd).toISOString().split('T')[0],
    ['ETPT sur la période (absentéisme et action 99 déduits)']: reelEtp < 0.0001 ? 0 : reelEtp,
    ['Temps ventilés sur la période (absentéisme et action 99 déduits)']: totalEtpt,
    ...refObj,
    ...(isCa() ? delegation : {}),
  }
}

function computeFallbackReelEtp(human, dateStart, dateStop, totalIndispo) {
  const situations = sortBy(human.situations || [], 'dateStart', 'asc')
  const reelEtpObject = []

  for (let i = 0; i < situations.length; i++) {
    const situation = situations[i]

    let nextDateStart = situation.dateStart <= dateStart ? dateStart : situation.dateStart
    nextDateStart = nextDateStart <= dateStop ? nextDateStart : null

    const middleDate = situation.dateStart <= dateStop ? new Date(situation.dateStart) : null
    const nextEndDate = middleDate && i < situations.length - 1 ? middleDate : dateStop

    if (nextDateStart && nextEndDate && today(nextDateStart) < today(nextEndDate)) {
      const countNbOfDays = nbWorkingDays(today(nextDateStart), today(nextEndDate))
      if (typeof countNbOfDays === 'number' && nextDateStart <= nextEndDate) {
        reelEtpObject.push({
          etp: situation.etp * countNbOfDays,
          countNbOfDays: countNbOfDays,
        })
      }
    }
  }

  const isGone = dateStop > human.dateEnd && human.dateEnd > dateStart
  const hasArrived = dateStart < human.dateStart && human.dateStart < dateStop

  const totalEtp = sumBy(reelEtpObject, 'etp')
  const totalDays = sumBy(reelEtpObject, 'countNbOfDays')

  if (totalDays === 0) return 0

  const base = totalEtp / totalDays

  if (human.dateEnd && isGone && hasArrived && dateStart) {
    return (base * nbOfDays(human.dateStart, human.dateEnd)) / nbOfDays(dateStart, dateStop) - totalIndispo
  }

  if (human.dateEnd && isGone) {
    return (base * nbOfDays(dateStart, human.dateEnd)) / nbOfDays(dateStart, dateStop) - totalIndispo
  }

  if (hasArrived && dateStart) {
    return (base * nbOfDays(human.dateStart, dateStop)) / nbOfDays(dateStart, dateStop) - totalIndispo
  }

  return base - totalIndispo
}
