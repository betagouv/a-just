import { cloneDeep, isNumber, orderBy, sortBy, sumBy, toUpper } from 'lodash'
import { ABSENTEISME_LABELS, CET_LABEL, DELEGATION_TJ, INDISPO_L3 } from '../constants/referentiel'
import { findSituation, generateHRIndexes } from './human-resource'
import { getHRVentilation, getHRVentilationOld } from '../utils/calculator'
import { FUNCTIONS_ONLY_FOR_DDG_EXTRACTOR, FUNCTIONS_ONLY_FOR_DDG_EXTRACTOR_CA } from '../constants/extractor'
import { isCa, isTj } from './ca'
import { checkAbort } from './abordTimeout'
import { getWorkingDaysFromIndispos, searchAgentIndisposWithIndexes } from './indisponibilities'
import {
  comparerDatesJourMoisAnnee,
  estApresJourMoisAnnee,
  formatDate,
  getWorkingDaysCount,
  normalizeDate,
  setTimeToMidDay,
  timeOr,
  today,
} from '../utils/date'
import { fixDecimal } from './number'
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
 * Retourne une liste "aplatie" (parent + enfants à la suite)
 * @param {{ id: number|string, label: string, childrens?: any[] }[]} flatReferentiel
 * @returns {{ flatReferentiel: any[], ctxL3: (number|string)[], indispoL3: number|string|null }}
 */
export const createFlatReferentiel = (flatReferentiel) => {
  const flat = []
  const ctxL3 = []
  let indispoL3 = null

  for (let i = 0; i < flatReferentiel.length; i++) {
    const node = flatReferentiel[i]

    flat.push(node)
    ctxL3.push(node.id)
    if (node.label === INDISPO_L3) indispoL3 = node.id

    const children = node.childrens
    if (children && children.length) {
      for (let y = 0; y < children.length; y++) {
        flat.push(children[y])
      }
    }
  }

  return { flatReferentiel: flat, ctxL3, indispoL3 }
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
}*/

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

/**
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
  backupId,
  signal,
) => {
  const map = await readExtraction(backupId, dateStart, dateStop)
  let onglet2 = []
  dateStart = setTimeToMidDay(dateStart)
  dateStop = setTimeToMidDay(dateStop)
  let { allIndispRefIds, refIndispo } = getIndispoDetails(flatReferentielsList)

  console.time('extractor-5.2')
  for (const human of allHuman) {
    const id = String(human.id)
    if (Object.hasOwn(map, id)) {
      const value = map[id]
      onglet2.push(value)
      continue
    }

    const { currentSituation } = findSituation(human, undefined)
    checkAbort(signal)

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
            const etpAffected = getHRVentilationOld(human, referentiel.id, [...categories], dateStart, dateStop, true, absLabels)

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
        const res = {
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
          ['ETPT sur la période absentéisme non déduit (hors action 99)']: reelEtp < 0.0001 ? 0 : reelEtp || 0,
          ['Temps ventilés sur la période (hors action 99)']: returnAIfClose(reelEtp, totalEtpt),
          ['Ecart → ventilations manquantes dans A-JUST']: [0, NaN].includes(returnAIfClose(0, reelEtp - totalEtpt)) ? '-' : reelEtp - totalEtpt,
          ...gaps,
          ...refObj,
          ['CET > 30 jours']: nbGlobalDaysCET >= 30 ? CETTotalEtp : 0,
          ['CET < 30 jours']: nbGlobalDaysCET < 30 ? CETTotalEtp : 0,
          ...absenteismeDetails,
          ['TOTAL absentéisme réintégré (CMO + Congé maternité + Autre absentéisme  + CET < 30 jours)']: absenteisme,
          ...(isCa() ? delegation : {}),
        }
        console.log('go DDG')

        onglet2.push(res)
        await upsertAgentExtraction(backupId, dateStart, dateStop, human.id, res)
        checkAbort(signal)
      }
  }
  console.timeEnd('extractor-5.2')

  onglet2 = orderBy(onglet2, ['Catégorie', 'Nom', 'Prénom', 'Matricule'], ['desc', 'asc', 'asc', 'asc'])

  return onglet2
}*/

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
    ongletLogs: params.ongletLogs,
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
/**
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
  old,
  backupId,
}) {
  let [onglet1, onglet2] = await Promise.all([
    computeExtractv2(
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
      backupId,
    ),
    computeExtractDdg(
      indexes,
      cloneDeep(allHuman),
      flatReferentielsList,
      categories,
      categoryFilter,
      juridictionName,
      dateStart,
      dateStop,
      isJirs,
      backupId,
      signal,
    ),
  ])
  //if (old)
  return { onglet1, onglet2 }
  //else return { onglet3: onglet1, onglet4: onglet2 }
}
*/
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
/**
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
}*/
/**
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
  backupId,
) => {
  console.time('extractor-5.2bis')

  const pLimit = require('p-limit')
  const limit = pLimit(10)

  const allIndispRefIds = getIndispoDetails(flatReferentielsList).allIndispRefIds
  const refIndispo = getIndispoDetails(flatReferentielsList).refIndispo

  const schema = await readJurisdictionSchema(backupId, dateStart, dateStop)

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
        schema,
      }),
    ),
  )

  let results = await Promise.all(humanTasks)

  console.timeEnd('extractor-5.2bis')

  results = orderBy(results, ['Catégorie', 'Nom', 'Prénom', 'Matricule'], ['desc', 'asc', 'asc', 'asc'])

  results = results.filter(Boolean)

  await saveJurisdictionArray(backupId, dateStart, dateStop, results)

  return results
}
*/
/**async function computeHumanExtract(params) {
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
    schema,
  } = params

  checkAbort(signal)

  if (schema) {
    const agent = getAgentFromSchema(schema, human.id) // objet agent | null
    if (agent) return agent
  }
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

  const indispoArray = [
    ...(await Promise.all(
      flatReferentielsList.map(async (referentiel) => {
        checkAbort(signal)
        const situations = human.situations || []
        const indisponibilities = human.indisponibilities || []

        const isUsedInSituation = situations.some((s) => (s.activities || []).some((a) => a.contentieux.id === referentiel.id))

        const isUsedInIndispo = indisponibilities.some((indisponibility) => indisponibility.contentieux.id === referentiel.id)

        if (isUsedInSituation || isUsedInIndispo) {
          const localEtpAffected = getHRVentilationOld(human, referentiel.id, [...categories], dateStart, dateStop, undefined, undefined)

          const { counterEtpTotal, counterEtpSubTotal, counterIndispo, counterReelEtp } = {
            ...(await countEtp({ ...localEtpAffected }, referentiel)),
          }

          checkAbort(signal)

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

  checkAbort(signal)
  //console.log('go ajust')

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
    ['Temps ventilés sur la période (absentéisme et action 99 déduits)']: returnAIfClose(reelEtp, totalEtpt),
    ...refObj,
    ...(isCa() ? delegation : {}),
  }
}
*/
export const formatFunctions = async (functionList) => {
  let list = [...functionList, ...(isCa() ? FUNCTIONS_ONLY_FOR_DDG_EXTRACTOR_CA : FUNCTIONS_ONLY_FOR_DDG_EXTRACTOR)]
  list = list.map((fct) => {
    return { CONCAT: fct['category_label'] + fct['code'], ...fct }
  })

  return orderBy(list, ['category_label', 'rank', 'code'], ['desc', 'asc', 'asc'])
}

// tolérance typique pour tes données : 1e-4
const TOL = 1e-4 + Number.EPSILON

// Retourne `a` si |a - b| ≤ TOL, sinon `undefined`
function returnAIfClose(a, b, tol = TOL) {
  const d = a - b // 1 soustraction
  return (d < 0 ? -d : d) <= tol // abs sans appel de fonction
    ? a
    : b
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

/**
export async function computeExtractor(models, params, onProgress) {
  const { backupId, dateStart, dateStop, categoryFilter, old = true } = params

  onProgress?.(5, 'init')

  const juridictionName = await models.HRBackups.findById(backupId)
  const isJirs = await models.ContentieuxReferentiels.isJirs(backupId)
  const referentiels = await models.ContentieuxReferentiels.getReferentiels(backupId, true, undefined, false, true)
  onProgress?.(15, 'referentiels')

  const flatReferentielsList = await flatListOfContentieuxAndSousContentieux([...referentiels])
  onProgress?.(25, 'flat')

  let hr = await loadOrWarmHR(backupId, models)
  onProgress?.(35, 'hr')

  const categories = await models.HRCategories.getAll()
  const functionList = await models.HRFonctions.getAllFormatDdg()
  const formatedFunctions = await formatFunctions(functionList)
  const allHuman = await getHumanRessourceList(hr, undefined, undefined, undefined, today(dateStart), today(dateStop))
  onProgress?.(45, 'prep')

  const indexes = await generateHRIndexes(allHuman)
  onProgress?.(50, 'index')

  const { onglet1, onglet2 } = await runExtractsInParallel({
    indexes,
    allHuman,
    flatReferentielsList,
    categories,
    categoryFilter,
    juridictionName,
    dateStart,
    dateStop,
    isJirs,
    old,
  })
  onProgress?.(70, 'extracts')

  const excelRef = buildExcelRef(flatReferentielsList)
  const { tproxs, allJuridiction } = await getJuridictionData(models, juridictionName)

  const onglet1Data = { values: onglet1, columnSize: await autofitColumns(onglet1, true) }
  const onglet2Data = { values: onglet2, columnSize: await autofitColumns(onglet2, true, 13), excelRef }

  const viewModel = await getViewModel({ referentiels, tproxs, onglet1: onglet1Data, onglet2: onglet2Data, allJuridiction })
  onProgress?.(95, 'finalize')

  return {
    fonctions: formatedFunctions,
    referentiels,
    tproxs,
    onglet1: onglet1Data,
    onglet2: onglet2Data,
    allJuridiction,
    viewModel,
  }
}
*/
export function fillAgentData(human, pData, etpts, filledReferentiel, flatReferentiel, isJirs, juridictionName) {
  const filledVentilations = mapIdToLabelObject(filledReferentiel, flatReferentiel)

  return {
    ['Réf.']: String(human.id),
    ...(isCa() ? { Juridiction: juridictionName.label } : { Arrondissement: juridictionName.label }),
    Nom: human.lastName,
    Prénom: human.firstName,
    Matricule: human.matricule,
    Catégorie: pData.category,
    Fonction: pData.fonction,
    ['Fonction recodée']: null,
    ...(isCa() ? { ['_']: null } : { TJCPH: null }),
    ...(isCa() ? { ['__']: null } : { Juridiction: null }),
    Jirs: isJirs ? 'x' : '',
    ["Date d'arrivée"]: human.dateStart === null ? null : setTimeToMidDay(human.dateStart).toISOString().split('T')[0],
    ['Date de départ']: human.dateEnd === null ? null : setTimeToMidDay(human.dateEnd).toISOString().split('T')[0],
    ['ETPT sur la période (absentéisme et action 99 déduits)']: etpts.realEtp,
    ['Temps ventilés sur la période (absentéisme et action 99 déduits)']: etpts.effectiveEtp ?? 0,
    ...filledVentilations,
    //METTRE DELEGATION TJ JUSTE AVANT LES INDISPOS...(isCa() ? delegation : {}),
  }
}

export function mapIdToLabelObject(m, refs, merge) {
  // 1) Index id -> label
  const idToLabel = Object.create(null)
  for (let i = 0, n = refs.length; i < n; i++) {
    const r = refs[i]
    // Clé stringifiée pour uniformiser string/number
    if (r.childrens && r.childrens.length) idToLabel[r.id] = r.code_import + ' TOTAL ' + toUpper(r.label)
    else idToLabel[r.id] = r.code_import + ' ' + toUpper(r.label)
  }

  // 2) Construire { label: value }
  const out = Object.create(null)
  for (const pair of m) {
    const id = pair[0]
    const value = pair[1]
    const label = idToLabel[id]
    if (label == null) continue // ignore les id inconnus

    if (merge && out[label] !== undefined) {
      out[label] = merge(out[label], value, id, label)
    } else {
      out[label] = value // par défaut : "dernier gagne"
    }
  }
  //console.log(out)
  return out
}

/**
 * Garde les humans dont la période chevauche [query.start, query.dateStop] (bornes incluses).
 */
export function filterHumansOverlappingWindow(humans, query) {
  return humans.filter((human) => !(normalizeDate(human.dateEnd) < normalizeDate(query.start) || normalizeDate(human.dateStart) > normalizeDate(query.end)))
}

// Predicate (chevauchement inclusif : présent même partiellement)
export const isHumanPresentOnInterval = (human, query) => {
  const qs = timeOr(query.start ?? query.dateStart, -Infinity)
  const qe = timeOr(query.end ?? query.dateStop, +Infinity)
  const hs = timeOr(human.dateStart, -Infinity)
  const he = timeOr(human.dateEnd, +Infinity)
  return he >= qs && hs <= qe
}

function isolateAbsenteismeAndDelegation(obj) {
  if (!obj || typeof obj !== 'object') return { remaining: {}, absOrdered: {}, delegationEntry: null }

  const normalize = (s) =>
    String(s || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim()

  // Préparer une liste de tuples { key, value, nk } pour n'avoir qu'une normalization par clé
  const entries = Object.keys(obj).map((k) => ({ k, v: obj[k], nk: normalize(k) }))

  const absOrdered = {}
  const removed = new Set()

  // 1) extraire les absences selon ABSENTEISME_LABELS (ordre contrôlé par ABSENTEISME_LABELS)
  for (const label of ABSENTEISME_LABELS) {
    const nl = normalize(label)
    // récupérer les clés correspondantes non encore retirées
    const matches = entries.filter((e) => !removed.has(e.k) && e.nk.includes(nl)).sort((a, b) => a.k.localeCompare(b.k, 'fr'))
    for (const m of matches) {
      absOrdered[m.k] = m.v
      removed.add(m.k)
    }
  }

  // 3) délégation TJ (matching insensible à casse/accents)
  const ndel = normalize(DELEGATION_TJ)
  const delegationEntryKey = entries.find((e) => !removed.has(e.k) && (e.nk.includes(ndel) || e.nk.includes('delegation tj')))
  let delegationEntry = null
  if (delegationEntryKey) {
    delegationEntry = { [delegationEntryKey.k]: delegationEntryKey.v }
    removed.add(delegationEntryKey.k)
  }

  // remaining : reconstruire en conservant l'ordre d'origine pour les clés non retirées
  const remaining = {}
  for (const e of entries) {
    if (!removed.has(e.k)) remaining[e.k] = e.v
  }

  return { remaining, absOrdered, delegationEntry }
}

export function fillAgentDataDdg(human, pData, abs, filledReferentiel, flatReferentiel, isJirs, juridictionName, logs, query, indispoL3) {
  let filledVentilations = mapIdToLabelObject(filledReferentiel, flatReferentiel)
  filledVentilations = Object.fromEntries(
    Object.entries(filledVentilations).filter(([k]) => !['14.2. COMPTE ÉPARGNE TEMPS', '12.2. COMPTE ÉPARGNE TEMPS'].includes(k)),
  )
  if (human.juridiction && human.juridiction.length !== 0) human.juridiction = human.juridiction.replaceAll('TPR ', 'TPRX ')

  const { remaining, absOrdered, delegationEntry } = isolateAbsenteismeAndDelegation(filledVentilations)
  //let remaining = filledVentilations
  //let absOrdered = {}
  //let delegationEntry = null

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
  const agentDdg = {
    ['Réf.']: String(human.id),
    Arrondissement: juridictionName.label,
    Jirs: isJirs ? 'x' : '',
    Juridiction: (human.juridiction || juridictionName.label).toUpperCase(),
    Nom: human.lastName,
    Prénom: human.firstName,
    Matricule: human.matricule,
    Catégorie: pData.category,
    Fonction: pData.fonction,
    ['Fonction recodée']: null,
    ['Code fonction par défaut']: pData.fonctionCategory,
    ['Fonction agrégat']: null,
    ['TJCPH']: null,
    ["Date d'arrivée"]: human.dateStart === null ? null : setTimeToMidDay(human.dateStart).toISOString().split('T')[0],
    ['Date de départ']: human.dateEnd === null ? null : setTimeToMidDay(human.dateEnd).toISOString().split('T')[0],
    ['ETPT sur la période absentéisme non déduit (hors action 99)']: abs.realEtp,
    ['Temps ventilés sur la période (hors action 99)']: abs.effectiveEtp ?? 0,
    ['Ecart → ventilations manquantes dans A-JUST']: abs.realEtp - abs.effectiveEtp,
    ...gaps,
    ...remaining, //...filledVentilations,
    ['CET > 30 jours']: abs.CET ?? 0,
    ['CET < 30 jours']: abs['CET<30'] ?? 0,
    ...absOrdered, // Mettre l'absenteisme ici
    ['TOTAL absentéisme réintégré (CMO + Congé maternité + Autre absentéisme  + CET < 30 jours)']: abs.absenteisme ?? 0,
    ...delegationEntry, // Mettre la délégation TJ à la fin
  }

  logs.push(
    buildEmptyLogEntry(human, pData, abs.absenteisme, filledVentilations, filledReferentiel.get(indispoL3) ?? null, abs.realEtp, abs.effectiveEtp, true),
  )
  return { agentDdg, logs }
}

export function generateOnglets({
  hr,
  query,
  indexes,
  periodsByDate,
  emptyFlatMapReferentiel,
  mapRefIdsToLabels,
  ctxL3,
  indispoL3,
  CETId,
  flatReferentiel,
  isJirs,
  juridictionName,
  logs, // la fonction continue d'alimenter les logs (effet conservé)
}) {
  let onglet1 = new Array()
  let onglet2 = new Array()
  hr.forEach((human) => {
    let etpts = { realEtp: null, effectiveEtp: null }
    let pData = { category: null, fonction: null, fonctionCategory: null }
    let abs = { realEtp: null, effectiveEtp: null, absenteisme: null, 'CET<30': null, CET: null } // absTotal sur toute la période pour 1 agent, effectiveEtp etp ventillé

    let tmpAjustFlatMapReferentiel = cloneDeep(emptyFlatMapReferentiel)
    let tmpDdgFlatMapReferentiel = cloneDeep(emptyFlatMapReferentiel)

    const requestIndispo = searchAgentIndisposWithIndexes(indexes, query.start, query.end, human.id, CETId)
    const totalCETWorkingDays = getWorkingDaysFromIndispos(requestIndispo)
    const CETLessThan30days = totalCETWorkingDays <= 30
    const absLabels = [...ABSENTEISME_LABELS, ...(CETLessThan30days ? [CET_LABEL] : [])]
    const absMap = new Set(absLabels)

    //Récupération des ids des segments d'un agent
    const segments = indexes.agentIndex.get(human.id)

    if (segments && segments.length) {
      //Filtrer parmis toutes les périodes celles de l'agent pour avoir les détails de chaque segment
      const filteredPeriods = periodsByDate.filter((period) => segments.includes(period.periodId))
      const nbOfWorkingDaysQuery = getWorkingDaysCount(query.start, query.end)

      // ajouter dans `logs` un "segment vide" si le 1er segment commence après le début de la requête
      logs = pushMissingSegmentLog({
        filteredPeriods,
        human,
        query,
        nbOfWorkingDaysQuery,
        logs,
        totalCETWorkingDays,
        emptyFlatMapReferentiel,
        indispoL3,
        pData,
      })

      // Pour chaque période stable
      filteredPeriods.forEach((period) => {
        const periodStart = Math.max(today(period.start), today(query.start)) // Ajustement des dates en fonction de l'intervalle de requête
        const periodEnd = Math.min(today(period.end), today(query.end))
        const workingDays = getWorkingDaysCount(periodStart, periodEnd) // Nombre de jours ouvrés dans la période ajustée
        const hrEndDate = human?.dateEnd == null ? Infinity : today(human.dateEnd) // Ajustement de la date de fin
        const periodDetails = indexes.periodsDatabase.get(period.periodId) // Récupère le segment avec indispo
        let log = cloneDeep({ ventilations: [], indisponibilites: [] })
        let logAccVentilation = 0
        let logAccIndip = 0
        let logAccAction99Ddg = 0
        let currentAbsEffectiveEtp = 0 // Effective ETP du segment avec abs réintégré
        let totalIndispoRate = 0
        let absOnPeriod = 0

        // Exclure les période après un départ
        if (human?.dateEnd && (comparerDatesJourMoisAnnee(today(period.start), hrEndDate) || estApresJourMoisAnnee(today(period.start), hrEndDate))) {
          return
        }

        let currentEffectiveAbs = 0 // Total absentéisme effectif sur la période 0.9*3jours/522 + 0.1*3jours/522
        //Absentéisme
        if (periodDetails.indisponibilities.length) {
          totalIndispoRate = periodDetails.indisponibilities.reduce((s, i) => s + (i.percent || 0) / 100, 0) // somme des indispos
          const R = totalIndispoRate
          const E = period.etp
          const alpha = R > E ? E / R : 1 // règle proportionnelle universelle

          currentEffectiveAbs = periodDetails.indisponibilities.reduce((sum, i) => {
            const rate = ((i.percent || 0) / 100) * alpha
            console.log('indispo final', rate)
            return absMap.has(i?.contentieux.label) ? sum + rate : sum
          }, 0)

          absOnPeriod = (currentEffectiveAbs * workingDays) / nbOfWorkingDaysQuery
          console.log(absOnPeriod)
          abs.absenteisme = (abs.absenteisme ?? 0) + absOnPeriod
        }
        currentAbsEffectiveEtp = currentEffectiveAbs + period.effectiveETP
        //Ventilations
        for (const activityId of period.activityIds.keys()) {
          const activityPercentage = period.activityIds.get(activityId) || 0
          const effectiveETP = period.effectiveETP * (activityPercentage / 100)
          const effectiveETPDdg = currentAbsEffectiveEtp * (activityPercentage / 100)

          let contentieux = (effectiveETP * workingDays) / nbOfWorkingDaysQuery
          let contentieuxDdg = (effectiveETPDdg * workingDays) / nbOfWorkingDaysQuery
          if (activityId !== indispoL3) {
            log.ventilations.push({ ctx: mapRefIdsToLabels.get(String(activityId)), value: contentieuxDdg })
            tmpAjustFlatMapReferentiel.set(activityId, (tmpAjustFlatMapReferentiel.get(activityId) ?? 0) + contentieux)
            tmpDdgFlatMapReferentiel.set(activityId, (tmpDdgFlatMapReferentiel.get(activityId) ?? 0) + contentieuxDdg)
            if (ctxL3.includes(activityId)) {
              logAccVentilation += contentieuxDdg
              etpts.effectiveEtp = (etpts.effectiveEtp ?? 0) + contentieux
              abs.effectiveEtp = (abs.effectiveEtp ?? 0) + contentieuxDdg
            }
          }
        }

        //ETP total sur la periode de requete
        etpts.realEtp = (etpts.realEtp ?? 0) + ((period.effectiveETP ?? 0) * workingDays) / nbOfWorkingDaysQuery
        abs.realEtp = (abs.realEtp ?? 0) + ((currentAbsEffectiveEtp ?? 0) * workingDays) / nbOfWorkingDaysQuery

        //Indisponibilités
        if (periodDetails.indisponibilities.length) {
          // RÈGLE PROPORTIONNELLE
          const R = totalIndispoRate
          const E = period.etp
          const alpha = R > E ? E / R : 1
          periodDetails.indisponibilities.forEach((indispo) => {
            let indispoPercentage = indispo.percent / 100
            const periodStart = Math.max(today(indispo.dateStart), today(period.start), today(query.start), today(human.dateStart))
            const periodEnd = Math.min(today(indispo.dateStop ?? period.end), today(period.end), today(query.end), hrEndDate)
            const workingDays = getWorkingDaysCount(periodStart, periodEnd)
            const indisponibilite = (indispoPercentage * workingDays) / nbOfWorkingDaysQuery
            const ddgIndisponibilite = indisponibilite * alpha

            if (indispo.contentieux.label !== DELEGATION_TJ) {
              logAccIndip += indisponibilite
              tmpAjustFlatMapReferentiel.set(indispoL3, (tmpAjustFlatMapReferentiel.get(indispoL3) ?? 0) + indisponibilite)
            }
            if (indispo.contentieux.label !== INDISPO_L3) {
              log.indisponibilites.push({ ctx: indispo.contentieux.label, value: ddgIndisponibilite })
              tmpAjustFlatMapReferentiel.set(indispo.contentieux.id, (tmpAjustFlatMapReferentiel.get(indispo.contentieux.id) ?? 0) + indisponibilite)
              tmpDdgFlatMapReferentiel.set(indispo.contentieux.id, (tmpDdgFlatMapReferentiel.get(indispo.contentieux.id) ?? 0) + ddgIndisponibilite)
            }
            if (![INDISPO_L3, DELEGATION_TJ, ...absLabels].includes(indispo.contentieux.label)) {
              log.indisponibilites.push({ ctx: 'TOTAL INDISPONIBILITÉS', value: ddgIndisponibilite })
              logAccAction99Ddg += ddgIndisponibilite
              tmpDdgFlatMapReferentiel.set(indispoL3, (tmpDdgFlatMapReferentiel.get(indispoL3) ?? 0) + ddgIndisponibilite)
            }
          })
        }

        //Human details
        pData.category = periodDetails.category?.label ?? pData.category
        pData.fonction = periodDetails.fonction?.code ?? pData.fonction
        pData.fonctionCategory = periodDetails.fonction?.category_detail ?? pData.fonction

        //Add logs
        if (workingDays !== 0)
          logs.push(
            buildLogEntry({
              human,
              pData,
              periodStart,
              periodEnd,
              nbOfWorkingDaysQuery,
              workingDays,
              period,
              totalIndispoRate,
              logAccIndip,
              totalCETWorkingDays,
              absOnPeriod,
              indispoL3: logAccAction99Ddg,
              currentAbsEffectiveEtp,
              logAccVentilation,
              log,
            }),
          )
      })

      if (filteredPeriods.length === 0) {
        // ajouter dans `logs` un "segment vide" si l'agent n'a pas de période stable sur la requête
        logs.push(buildEmptyLogEntry(human))
      }
    }

    //CET
    if (!abs.absenteisme && tmpDdgFlatMapReferentiel.get(CETId)) abs.CET = tmpDdgFlatMapReferentiel.get(CETId)
    else if (abs.absenteisme) {
      if (CETLessThan30days) {
        abs['CET<30'] = tmpDdgFlatMapReferentiel.get(CETId)
      } else {
        abs.CET = tmpDdgFlatMapReferentiel.get(CETId)
      }
      tmpDdgFlatMapReferentiel.delete(CETId)
    }

    let agent = fillAgentData(human, pData, etpts, tmpAjustFlatMapReferentiel, flatReferentiel, isJirs, juridictionName)
    let resultDdg = fillAgentDataDdg(human, pData, abs, tmpDdgFlatMapReferentiel, flatReferentiel, isJirs, juridictionName, logs, query, indispoL3)
    let agentDdg = resultDdg.agentDdg
    logs = resultDdg.logs

    /**
    // Ajouter un formatage différent de l'extracteur DDG
    for (const [key, value] of Object.entries(agent)) {
      if (isNumber(value) && value !== 0) agent[key] = fixDecimal(value, 10000)
      if (key == 'ETPT sur la période (absentéisme et action 99 déduits)' && [undefined, null].includes(agent[key])) agent[key] = null
    }
    for (const [key, value] of Object.entries(agentDdg)) {
      if (isNumber(value) && value !== 0) agentDdg[key] = fixDecimal(value, 10000)
      if (key == 'ETPT sur la période (absentéisme et action 99 déduits)' && [undefined, null].includes(agentDdg[key])) agentDdg[key] = null
      if (key == 'Ecart → ventilations manquantes dans A-JUST' && [NaN, 0].includes(agentDdg[key])) agentDdg[key] = '-'
      if (key == 'TOTAL absentéisme réintégré (CMO + Congé maternité + Autre absentéisme  + CET < 30 jours)' && agentDdg[key] === null) agentDdg[key] = 0
    }
    */

    onglet1.push(agent)
    onglet2.push(agentDdg)
  })

  //logs.sort((a, b) => a.id - b.id || a.periodStart - b.periodStart)
  logs = orderBy(logs, ['id', 'periodStartTimestamp'], ['asc', 'desc'])

  return { onglet1, onglet2, ongletLogs: logs }
}

function formatCtxEntries(entries) {
  // Sépare par un point intercalé pour meilleure lisibilité
  return entries.map((x) => `${x.ctx} => ${fixDecimal(x.value, 1000)}`).join(' · ')
}

/**
 * Transforme un objet en une chaîne de caractères formatée pour le contexte des logs
 * @param {*} obj
 * @returns
 */
export function mapObjectToCtxString(obj) {
  if (!obj || typeof obj !== 'object') return ''
  return Object.entries(obj)
    .filter(([, v]) => v !== 0 && v !== null && v !== undefined)
    .map(([k, v]) => {
      const n = typeof v === 'number' ? v : parseFloat(String(v).replace(',', '.'))
      const display = Number.isFinite(n) ? (Number.isInteger(n) ? String(n) : String(Math.round(n * 1000) / 1000)) : String(v)
      return `${k} => ${display}`
    })
    .join(' · ')
}

/**
 * Retourne une log entry ne contenant que l'id et le name (tout le reste null)
 * @param {{ id: any, firstName?: string, lastName?: string, matricule?: string }} human
 * @returns {Object}
 */
export function buildEmptyLogEntry(
  human,
  pData = null,
  absOnPeriod = null,
  tmpDdgFlatMapReferentiel = null,
  action99 = null,
  currentAbsEffectiveEtp = null,
  logAccVentilation = null,
  main = false,
) {
  return {
    id: human.id,
    name: `${human.firstName || ''} ${human.lastName || ''} ${human.matricule ?? ''}`.trim(),
    category: pData?.category || null,
    humanStart: human.dateStart ? formatDate(human.dateStart) : null,
    humanEnd: human.dateEnd ? formatDate(human.dateEnd) : null,
    periodStart: null, //query.start ? formatDate(query.start) : null,
    periodEnd: null, // query.end ? formatDate(query.end) : null,
    nbOfWorkingDaysQuery: null,
    workingDays: null,
    dayRate: null,
    filledEtp: null,
    queryEtpValue: null,
    totalIndispo: null,
    queryIndispoValue: null,
    cetDays: null,
    abs: absOnPeriod !== null && absOnPeriod !== 0 ? absOnPeriod : null,
    action99: action99 !== null && action99 !== 0 ? action99 : null,
    effectifEtp: currentAbsEffectiveEtp !== null ? (currentAbsEffectiveEtp ?? 0) : null,
    logAccVentilation: logAccVentilation !== null ? logAccVentilation : null,
    ctx: tmpDdgFlatMapReferentiel ? mapObjectToCtxString(tmpDdgFlatMapReferentiel) : null,
    periodStartTimestamp: null,
    main: main ? 'x' : '',
  }
}

function buildLogEntry({
  human,
  pData,
  periodStart,
  periodEnd,
  nbOfWorkingDaysQuery,
  workingDays,
  period,
  totalIndispoRate,
  logAccIndip,
  totalCETWorkingDays,
  absOnPeriod,
  indispoL3,
  currentAbsEffectiveEtp,
  logAccVentilation,
  log,
}) {
  return {
    id: human.id,
    name: `${human.firstName} ${human.lastName} ${human.matricule ?? ''}`,
    category: pData.category,
    humanStart: formatDate(human.dateStart),
    humanEnd: human.dateEnd ? formatDate(human.dateEnd) : null,
    periodStart: formatDate(periodStart),
    periodEnd: formatDate(periodEnd),
    nbOfWorkingDaysQuery,
    workingDays,
    dayRate: workingDays / nbOfWorkingDaysQuery,
    filledEtp: period.etp,
    queryEtpValue: (period.etp * workingDays) / nbOfWorkingDaysQuery,
    totalIndispo: totalIndispoRate !== 0 ? totalIndispoRate : null,
    queryIndispoValue: totalIndispoRate !== 0 ? logAccIndip : null,
    cetDays: totalCETWorkingDays !== 0 ? totalCETWorkingDays : null,
    abs: absOnPeriod !== 0 ? absOnPeriod : null,
    action99: indispoL3 !== 0 ? indispoL3 : null,
    effectifEtp: ((currentAbsEffectiveEtp ?? 0) * workingDays) / nbOfWorkingDaysQuery,
    logAccVentilation: logAccVentilation,
    ctx: formatCtxEntries([...log.ventilations, ...log.indisponibilites]),
    periodStartTimestamp: today(periodStart).getTime(),
    main: '',
  }
}

function pushMissingSegmentLog({ filteredPeriods, human, query, nbOfWorkingDaysQuery, logs, totalCETWorkingDays, emptyFlatMapReferentiel, indispoL3, pData }) {
  if (!filteredPeriods || !filteredPeriods.length) return logs

  const sorted = [...filteredPeriods].sort((a, b) => today(a.start) - today(b.start))
  const first = sorted[0]
  const queryStartDate = today(query.start)
  const agentArrival = human?.dateStart ? today(human.dateStart) : queryStartDate
  const gapStart = Math.max(queryStartDate, agentArrival)
  const firstStartDate = today(first.start)

  if (firstStartDate.getTime() <= gapStart) return logs

  // couvrir le trou depuis gapStart jusqu'au jour précédent le premier segment
  const missingStart = gapStart
  const missingEnd = new Date(firstStartDate)
  missingEnd.setDate(missingEnd.getDate() - 1)

  const missingWorkingDays = getWorkingDaysCount(missingStart, missingEnd)
  if (missingWorkingDays <= 0) return logs

  const syntheticPeriod = {
    periodId: `missing-${human.id}-${today(missingStart).getTime()}`,
    start: missingStart,
    end: missingEnd,
    etp: 0,
    effectiveETP: 0,
    activityIds: new Map(),
  }
  const syntheticLog = cloneDeep({ ventilations: [], indisponibilites: [] })

  logs.push(
    buildLogEntry({
      human,
      pData,
      periodStart: missingStart,
      periodEnd: missingEnd,
      nbOfWorkingDaysQuery,
      workingDays: missingWorkingDays,
      period: syntheticPeriod,
      totalIndispoRate: 0,
      logAccIndip: 0,
      totalCETWorkingDays,
      absOnPeriod: 0,
      indispoL3,
      currentAbsEffectiveEtp: 0,
      logAccVentilation: 0,
      log: syntheticLog,
    }),
  )
  return logs
}
