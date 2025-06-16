import { minBy, orderBy, sumBy } from 'lodash'
import { getTime, getWorkingDaysCount, isDateGreaterOrEqual, today, workingDay } from '../utils/date'
import { checkAbort } from './abordTimeout'
import { fixDecimal } from './number'
import { IntervalTree } from './intervalTree'

/**
 * Calcul d'ETP à une date donnée pour un ensemble de ressources humaines
 * @param {*} referentielId
 * @param {*} date
 * @param {*} hr
 * @returns objet d'ETP détaillé
 */
export function getEtpByDateAndPerson(referentielId, date, hr, ddgFilter = false, absLabels = null, signal = null) {
  if (hr.dateEnd && today(hr.dateEnd) < today(date)) {
    return {
      etp: null,
      situation: null,
      reelEtp: null,
      indispoFiltred: [],
      nextDeltaDate: null,
      addDay: true,
    }
  }

  let addDay = true
  checkAbort(signal)
  const { currentSituation, nextSituation } = findSituation(hr, date, signal)
  const situation = currentSituation

  if (situation && situation.category && situation.category.id) {
    const activitiesFiltred = (situation.activities || []).filter((a) => a.contentieux && a.contentieux.id === referentielId)

    const indispoFiltred = findAllIndisponibilities(hr, date, ddgFilter, absLabels || [])

    let reelEtp = situation.etp - sumBy(indispoFiltred, 'percent') / 100
    if (reelEtp < 0) {
      reelEtp = 0
    }

    // trouve la date de fin d'indispo la plus proche
    let nextIndispoDate = null
    const allIndispoDatesEnd = indispoFiltred.filter((i) => i.dateStopTimesTamps && i.dateStopTimesTamps >= getTime(date)).map((i) => i.dateStopTimesTamps)
    if (allIndispoDatesEnd.length) {
      const min = minBy(allIndispoDatesEnd)
      nextIndispoDate = new Date(min)
    }

    const indispos = hr.indisponibilities || []
    let listAllDatesIndispoStart = indispos.filter((i) => i.dateStartTimesTamps && i.dateStartTimesTamps > getTime(date)).map((i) => i.dateStartTimesTamps)
    if (listAllDatesIndispoStart.length && (minBy(listAllDatesIndispoStart) <= getTime(nextIndispoDate) || !nextIndispoDate)) {
      const min = minBy(listAllDatesIndispoStart)
      nextIndispoDate = new Date(min)
      nextIndispoDate.setDate(nextIndispoDate.getDate() - 1)
    }

    let nextDeltaDate = null
    if (nextSituation) {
      nextDeltaDate = today(nextSituation.dateStart)
      nextDeltaDate.setDate(nextDeltaDate.getDate() - 1) // on enlève un jour pour que la date corresponde à la date de la situation
    }
    if (nextIndispoDate && (!nextDeltaDate || nextIndispoDate.getTime() <= nextDeltaDate.getTime())) {
      nextDeltaDate = nextIndispoDate
    }
    if ((!nextDeltaDate && hr.dateEnd) || (nextDeltaDate && hr.dateEnd && today(hr.dateEnd).getTime() < nextDeltaDate.getTime())) {
      nextDeltaDate = today(hr.dateEnd)
    }

    checkAbort(signal)

    return {
      etp: (reelEtp * sumBy(activitiesFiltred, 'percent')) / 100,
      reelEtp,
      situation,
      indispoFiltred: !ddgFilter ? indispoFiltred : findAllIndisponibilities(hr, date),
      nextDeltaDate, // find the next date with have changes
      addDay,
    }
  }

  return {
    etp: null,
    situation: null,
    reelEtp: null,
    indispoFiltred: [],
    nextDeltaDate: hr.dateStart && today(hr.dateStart) > today(date) ? today(hr.dateStart) : null,
    addDay: hr.dateStart && today(hr.dateStart) > today(date) ? false : addDay,
  }
}

/**
 * Calcul d'ETP à une date donnée pour un ensemble de ressources humaines et un contentieux donné
 * @param {*} referentielId
 * @param {*} date
 * @param {*} hr
 * @returns objet d'ETP détaillé
 */
export async function getEtpByDateAndPersonSimu(referentielId, date, hr, signal = null) {
  const { currentSituation: situation, nextSituation } = findSituation(hr, date)

  if (situation && situation.category && situation.category.id) {
    // console.log(referentielId, date, hr)
    const activitiesFiltred = await (situation.activities || []).filter((a) => a.contentieux && referentielId.includes(a.contentieux.id))
    checkAbort(signal)

    const indispoFiltred = findAllIndisponibilities(hr, date)
    let reelEtp = situation.etp - sumBy(indispoFiltred, 'percent') / 100
    if (reelEtp < 0) {
      reelEtp = 0
    }

    const nextIndispoDate = getNextIndisponiblitiesDate(hr, date)
    let nextDeltaDate = null
    if (nextSituation) {
      nextDeltaDate = today(nextSituation.dateStart)
    }
    if (nextIndispoDate && (!nextDeltaDate || nextIndispoDate.getTime() < nextDeltaDate.getTime())) {
      nextDeltaDate = nextIndispoDate
    }

    return {
      etp: (reelEtp * sumBy(activitiesFiltred, 'percent')) / 100,
      reelEtp,
      situation,
      indispoFiltred,
      nextDeltaDate, // find the next date with have changes
    }
  }

  return {
    etp: null,
    situation: null,
    indispoFiltred: [],
    nextDeltaDate: null,
  }
}

/**
 * Récupère la prochaine date d'indisponibilité d'une ressource humaine
 * @param {*} hr
 * @param {*} dateSelected
 * @returns date de la prochaine indispo
 */
export const getNextIndisponiblitiesDate = (hr, dateSelected) => {
  dateSelected = today(dateSelected).getTime()
  const indispos = hr.indisponibilities || []
  let listAllDates = indispos.filter((i) => i.dateStartTimesTamps).map((i) => i.dateStartTimesTamps)
  listAllDates = listAllDates.concat(indispos.filter((i) => i.dateStopTimesTamps).map((i) => i.dateStopTimesTamps))

  listAllDates = listAllDates.filter((date) => date > dateSelected)

  const min = minBy(listAllDates)
  return min ? new Date(min) : null
}

/**
 * Retourne la situation d'une personne à une date donnée
 * @param {*} hr
 * @param {*} date
 * @param {*} reelEtp
 * @returns objet contenant la situation en cours et la prochaine situation
 */
export const findSituation = (hr, date, signal = null) => {
  checkAbort(signal)
  if (date) {
    date = today(date)
  }

  if (hr && hr.dateEnd && date) {
    const dateEnd = today(hr.dateEnd)
    if (dateEnd.getTime() < date.getTime()) {
      return {
        id: 0,
        etp: 0,
        category: null,
        fonction: null,
        dateStart: dateEnd,
        activities: [],
      }
    }
  }

  let situations = findAllSituations(hr, date)
  const situationsInTheFutur = findAllFuturSituations(hr, date)
  checkAbort(signal)
  return {
    currentSituation: situations.length ? situations[0] : null,
    nextSituation: situationsInTheFutur.length ? situationsInTheFutur[situationsInTheFutur.length - 1] : null,
  }
}

/**
 * Retourne la liste de toutes les situaitons futures
 */
export const findAllFuturSituations = (hr, date) => {
  date = today(date)
  let situations = hr && hr.situations && hr.situations.length ? hr.situations : []

  if (date) {
    const getTime = date.getTime()
    const findedSituations = situations.filter((hra) => {
      return hra.dateStartTimesTamps > getTime
    })

    situations = findedSituations.slice(0)
  }

  return situations
}

/**
 * Retourne l'ensemble des situations passées d'une personne
 * @param {*} hr
 * @param {*} date
 * @returns liste de situation
 */
export const findAllSituations = (hr, date, order = 'desc', inFuture = false) => {
  let situations = orderBy(
    hr?.situations || [],
    [
      function (o) {
        const date = new Date(o.dateStart)
        return date.getTime()
      },
    ],
    // @ts-ignore
    [order],
  )

  if (date) {
    situations = situations.filter((hra) => {
      const dateStart = today(hra.dateStart)
      if (!inFuture) {
        return dateStart.getTime() <= date.getTime()
      } else {
        return dateStart.getTime() > date.getTime()
      }
    })
  }

  return situations
}

/**
 * Retourne la liste des indisponibilités
 * @param {*} hr
 * @param {*} date
 * @returns liste des indisponibilités filtrées
 */
const findAllIndisponibilities = (hr, date, ddgFilter = false, absLabels = []) => {
  let indisponibilities = hr && hr.indisponibilities && hr.indisponibilities.length ? hr.indisponibilities : []

  if (date instanceof Date) {
    date = today(date)
    indisponibilities = indisponibilities.filter((hra) => {
      const dateStart = today(hra.dateStart)
      if (date && isDateGreaterOrEqual(date, dateStart)) {
        if (hra.dateStop) {
          const dateStop = today(hra.dateStop)
          if (isDateGreaterOrEqual(dateStop, date)) {
            const d1 = new Date(2024, 8, 20)
            if (hr.id === 36732) {
              //console.log('date passed for indispo count',date,'end indispo date',dateStop)
            }

            if (!ddgFilter) return true
            else if (absLabels.includes(hra.contentieux.label) === false) return true
          }
        } else {
          // return true if they are no end date
          if (!ddgFilter) return true
          else if (absLabels.includes(hra.contentieux.label) === false) return true
        }
      }

      return false
    })
  }

  if (hr.id === 36429 && indisponibilities.length) {
    console.log('date indisp', date, indisponibilities[0].percent)
  }
  return indisponibilities
}

/**
 * TESTS
 * */
const HR_TO_TEST = {
  id: 1748,
  firstName: 'Aurélie',
  lastName: 'Lallart',
  matricule: '45661',
  dateStart: new Date('2019-09-01T22:00:00.000Z'),
  dateEnd: null,
  coverUrl: null,
  updatedAt: new Date('2024-04-02T08:16:48.377Z'),
  backupId: 16,
  juridiction: null,
  comment: '<p>Présidence 6ème chambre correctionnelle + "autre civil NS" = présidence de la Comex 1 mois sur 2</p>',
  situations: [
    {
      id: 15001,
      etp: 1,
      dateStart: new Date('2025-09-01T23:00:00.000Z'),
      dateStartTimesTamps: 1756767600000,
      category: { id: 1, rank: 1, label: 'Magistrat' },
      fonction: { id: 15, rank: 16, code: 'J', label: 'JUGE', category_detail: 'M-TIT', position: 'Titulaire', calculatriceIsActive: false },
      activities: [
        { id: 56031, percent: 22.5, contentieux: { id: 486, label: 'Siège Pénal' } },
        { id: 56030, percent: 67.5, contentieux: { id: 448, label: "Départage prud'homal" } },
        { id: 56034, percent: 10, contentieux: { id: 497, label: 'Autres activités' } },
        { id: 56032, percent: 12.5, contentieux: { id: 487, label: 'Collégiales hors JIRS' } },
        { id: 56033, percent: 10, contentieux: { id: 492, label: 'Tribunal de police' } },
        { id: 56029, percent: 67.5, contentieux: { id: 447, label: 'Contentieux Social' } },
        { id: 56035, percent: 10, contentieux: { id: 498, label: 'Soutien (hors formations suivies)' } },
      ],
    },
    {
      id: 15000,
      etp: 1,
      dateStart: new Date('2025-07-01T23:00:00.000Z'),
      dateStartTimesTamps: 1751410800000,
      category: { id: 1, rank: 1, label: 'Magistrat' },
      fonction: { id: 15, rank: 16, code: 'J', label: 'JUGE', category_detail: 'M-TIT', position: 'Titulaire', calculatriceIsActive: false },
      activities: [
        { id: 56031, percent: 22.5, contentieux: { id: 486, label: 'Siège Pénal' } },
        { id: 56030, percent: 67.5, contentieux: { id: 448, label: "Départage prud'homal" } },
        { id: 56034, percent: 10, contentieux: { id: 497, label: 'Autres activités' } },
        { id: 56032, percent: 12.5, contentieux: { id: 487, label: 'Collégiales hors JIRS' } },
        { id: 56033, percent: 10, contentieux: { id: 492, label: 'Tribunal de police' } },
        { id: 56029, percent: 67.5, contentieux: { id: 447, label: 'Contentieux Social' } },
        { id: 56035, percent: 10, contentieux: { id: 498, label: 'Soutien (hors formations suivies)' } },
      ],
    },
    {
      id: 14388,
      etp: 1,
      dateStart: new Date('2023-01-01T23:00:00.000Z'),
      dateStartTimesTamps: 1672660800000,
      category: { id: 1, rank: 1, label: 'Magistrat' },
      fonction: { id: 15, rank: 16, code: 'J', label: 'JUGE', category_detail: 'M-TIT', position: 'Titulaire', calculatriceIsActive: false },
      activities: [
        { id: 56031, percent: 22.5, contentieux: { id: 486, label: 'Siège Pénal' } },
        { id: 56030, percent: 67.5, contentieux: { id: 448, label: "Départage prud'homal" } },
        { id: 56034, percent: 10, contentieux: { id: 497, label: 'Autres activités' } },
        { id: 56032, percent: 12.5, contentieux: { id: 487, label: 'Collégiales hors JIRS' } },
        { id: 56033, percent: 10, contentieux: { id: 492, label: 'Tribunal de police' } },
        { id: 56029, percent: 67.5, contentieux: { id: 447, label: 'Contentieux Social' } },
        { id: 56035, percent: 10, contentieux: { id: 498, label: 'Soutien (hors formations suivies)' } },
      ],
    },
    {
      id: 14387,
      etp: 1,
      dateStart: new Date('2022-01-02T23:00:00.000Z'),
      dateStartTimesTamps: 1641211200000,
      category: { id: 1, rank: 1, label: 'Magistrat' },
      fonction: { id: 15, rank: 16, code: 'J', label: 'JUGE', category_detail: 'M-TIT', position: 'Titulaire', calculatriceIsActive: false },
      activities: [
        { id: 56031, percent: 22.5, contentieux: { id: 486, label: 'Siège Pénal' } },
        { id: 56030, percent: 67.5, contentieux: { id: 448, label: "Départage prud'homal" } },
        { id: 56034, percent: 10, contentieux: { id: 497, label: 'Autres activités' } },
        { id: 56032, percent: 12.5, contentieux: { id: 487, label: 'Collégiales hors JIRS' } },
        { id: 56033, percent: 10, contentieux: { id: 492, label: 'Tribunal de police' } },
        { id: 56029, percent: 67.5, contentieux: { id: 447, label: 'Contentieux Social' } },
        { id: 56035, percent: 10, contentieux: { id: 498, label: 'Soutien (hors formations suivies)' } },
      ],
    },
    {
      id: 2819,
      etp: 1,
      dateStart: new Date('2020-12-31T23:00:00.000Z'),
      dateStartTimesTamps: 1609502400000,
      category: { id: 1, rank: 1, label: 'Magistrat' },
      fonction: { id: 15, rank: 16, code: 'J', label: 'JUGE', category_detail: 'M-TIT', position: 'Titulaire', calculatriceIsActive: false },
      activities: [
        { id: 56031, percent: 22.5, contentieux: { id: 486, label: 'Siège Pénal' } },
        { id: 56030, percent: 67.5, contentieux: { id: 448, label: "Départage prud'homal" } },
        { id: 56034, percent: 10, contentieux: { id: 497, label: 'Autres activités' } },
        { id: 56032, percent: 12.5, contentieux: { id: 487, label: 'Collégiales hors JIRS' } },
        { id: 56033, percent: 10, contentieux: { id: 492, label: 'Tribunal de police' } },
        { id: 56029, percent: 67.5, contentieux: { id: 447, label: 'Contentieux Social' } },
        { id: 56035, percent: 10, contentieux: { id: 498, label: 'Soutien (hors formations suivies)' } },
      ],
    },
    {
      id: 2376,
      etp: 1,
      dateStart: new Date('2019-09-01T22:00:00.000Z'),
      dateStartTimesTamps: 1567425600000,
      category: { id: 1, rank: 1, label: 'Magistrat' },
      fonction: { id: 15, rank: 16, code: 'J', label: 'JUGE', category_detail: 'M-TIT', position: 'Titulaire', calculatriceIsActive: false },
      activities: [
        { id: 56031, percent: 22.5, contentieux: { id: 486, label: 'Siège Pénal' } },
        { id: 56030, percent: 67.5, contentieux: { id: 448, label: "Départage prud'homal" } },
        { id: 56034, percent: 10, contentieux: { id: 497, label: 'Autres activités' } },
        { id: 56032, percent: 12.5, contentieux: { id: 487, label: 'Collégiales hors JIRS' } },
        { id: 56033, percent: 10, contentieux: { id: 492, label: 'Tribunal de police' } },
        { id: 56029, percent: 67.5, contentieux: { id: 447, label: 'Contentieux Social' } },
        { id: 56035, percent: 10, contentieux: { id: 498, label: 'Soutien (hors formations suivies)' } },
      ],
    },
  ],
  indisponibilities: [],
}

const { setImmediate: setImmediatePromise } = require('timers/promises')

let periodIdCounter = 0
const generateUniqueId = () => {
  return periodIdCounter++
}

export const generateAndIndexAllStableHRPeriods = async (agents) => {
  const resultMap = new Map() // Map pour stocker les périodes par agent
  const periodsDatabase = new Map() // Base de données centrale pour stocker les périodes avec un ID unique

  const categoryIndex = new Map()
  const functionIndex = new Map()
  const contentieuxIndex = new Map()
  const agentIndex = new Map() // Index par agentId pour faciliter l'accès aux périodes par agent
  const intervalTree = new IntervalTree() // Arbre d'intervalle

  await Promise.all(
    agents.map(async (agent, index) => {
      // Petite pause pour ne pas bloquer l'event loop
      if (index % 50 === 0) await setImmediatePromise()

      const periods = generateStableHRPeriods(agent) // Générer les périodes pour l'agent

      // Pour chaque période générée, créer un ID unique et l'ajouter dans la base de données centrale
      periods.forEach((period) => {
        const periodId = generateUniqueId()

        // Ajouter la période à la base de données centrale
        periodsDatabase.set(periodId, {
          agentId: agent.id,
          start: period.start,
          end: period.end,
          etp: period.etp,
          effectiveETP: period.effectiveETP,
          fonction: period.fonction,
          category: period.category,
          activities: period.activities,
          indisponibilities: period.indisponibilities,
        })

        // Ajouter cette période à l'index de la catégorie
        if (!categoryIndex.has(period.category.id)) {
          categoryIndex.set(period.category.id, [])
        }
        categoryIndex.get(period.category.id).push(periodId)

        // Ajouter cette période à l'index de la fonction
        if (!functionIndex.has(period.fonction.id)) {
          functionIndex.set(period.fonction.id, [])
        }
        functionIndex.get(period.fonction.id).push(periodId)

        // Ajouter cette période à l'index du contentieux (si applicable)
        period.activities.forEach((activity) => {
          const contentieuxId = activity.contentieux.id
          if (!contentieuxIndex.has(contentieuxId)) {
            contentieuxIndex.set(contentieuxId, [])
          }
          contentieuxIndex.get(contentieuxId).push(periodId)
        })

        // Ajouter cette période à l'index de l'agentId
        if (!agentIndex.has(agent.id)) {
          agentIndex.set(agent.id, [])
        }
        agentIndex.get(agent.id).push(periodId)

        // Créer un Map pour stocker les contentieux avec leur pourcentage
        const contentieuxMap = new Map()

        // Ajouter chaque activité à l'index des contentieux
        period.activities.forEach((activity) => {
          const contentieuxId = activity.contentieux.id
          contentieuxMap.set(contentieuxId, activity.percent) // Ajouter dans le map avec contentieuxId comme clé et percent comme valeur

          // Ajouter cette période à l'index du contentieux
          if (!contentieuxIndex.has(contentieuxId)) {
            contentieuxIndex.set(contentieuxId, [])
          }
          contentieuxIndex.get(contentieuxId).push(periodId)
        })

        // Insérer cette période dans l'IntervalTree
        const start = today(period.start)
        const end = today(period.end)
        intervalTree.insert(start, end, {
          periodId,
          agentId: agent.id,
          categoryId: period.category.id,
          start: period.start,
          end: period.end,
          effectiveETP: period.effectiveETP,
          etp: period.etp,
          activityIds: contentieuxMap,
        })
      })

      // Stocker les périodes de l'agent dans le Map resultMap
      resultMap.set(agent.id, periods)
    }),
  )

  // Retourner les résultats et les index
  return {
    resultMap, // Carte des périodes par agent
    periodsDatabase, // Base de données centrale avec les périodes référencées
    categoryIndex, // Index par catégorie
    functionIndex, // Index par fonction
    contentieuxIndex, // Index par contentieux
    agentIndex, // Index par agentId
    intervalTree, // L'IntervalTree des périodes
  }
}

export const generateStableHRPeriods = (agent) => {
  // Déstructuration des données de l'agent
  const { id: agentId, dateStart: agentStart, dateEnd: agentEnd, situations = [], indisponibilities = [] } = agent

  // Affichage des informations de l'agent, des situations et des indisponibilités
  /**console.log('Agent:', { agentId, dateStart: agentStart, dateEnd: agentEnd })
  console.log('Situations:', situations)
  console.log('Indisponibilités:', indisponibilities)*/

  // Si l'agent n'a pas de date de début ou si aucune situation n'est définie, retourner un tableau vide
  if (!agentStart || situations.length === 0) return []

  // Fonction de normalisation des dates pour s'assurer qu'elles sont au format UTC 12h00
  const normalizeDate = (date) => {
    const d = new Date(date)
    // Si l'heure est 22h, on incrémente d'un jour pour éviter des erreurs de date
    if (d.getUTCHours() === 22 || d.getUTCHours() === 23) {
      d.setUTCDate(d.getUTCDate() + 1)
    }
    d.setUTCHours(12, 0, 0, 0) // On met l'heure à 12h00 pour les calculs
    return d
  }

  // Création de la liste des points de rupture
  const breakpoints = new Set()
  breakpoints.add(normalizeDate(agentStart)) // Point de départ de l'agent

  // On ajoute les points de départ des situations
  for (const s of situations) {
    if (s.dateStart) breakpoints.add(normalizeDate(s.dateStart))
  }

  // On ajoute les points de départ et de fin des indisponibilités
  for (const i of indisponibilities) {
    const iStart = normalizeDate(i.dateStart)
    let iStop

    if (i.dateStop) {
      iStop = normalizeDate(i.dateStop)
      // Si l'indisponibilité dure exactement un jour, on ajoute le lendemain comme point de rupture
      if (iStart.getTime() === iStop.getTime()) {
        breakpoints.add(new Date(iStop.getTime() + 24 * 60 * 60 * 1000))
      }
    } else {
      // Si l'indisponibilité n'a pas de date de fin, on prend la fin de l'agent ou une date très lointaine
      iStop = agentEnd ? normalizeDate(agentEnd) : new Date(9999, 11, 31, 12)
    }

    breakpoints.add(iStart)
    breakpoints.add(iStop)
  }

  // Ajout de la date de fin de l'agent ou d'une date par défaut
  breakpoints.add(agentEnd ? normalizeDate(agentEnd) : new Date(9999, 11, 31, 12))

  // Tri des points de rupture pour avoir un ordre chronologique
  const sorted = [...breakpoints].sort((a, b) => a - b)

  /**console.log(
    '📍 Sorted breakpoints:',
    sorted.map((d) => d.toISOString()),
  )*/

  const periods = [] // Tableau pour stocker les périodes générées
  let lastWasIndispoStop = false // Variable pour vérifier si la période précédente était causée par une indisponibilité
  let lastWasOneDayIndispoStop = false // Variable pour vérifier si la période précédente était causée par une indisponibilité

  // On parcourt chaque paire de points de rupture pour générer les périodes
  for (let i = 0; i < sorted.length - 1; i++) {
    let start = new Date(sorted[i])
    let end = new Date(sorted[i + 1])

    // Trouver la situation active pour cette période
    const currentSituation = situations.sort((a, b) => new Date(b.dateStart) - new Date(a.dateStart)).find((s) => normalizeDate(s.dateStart) <= start)

    if (!currentSituation) {
      //console.warn(`⛔ Aucune situation trouvée pour la période ${start.toISOString()} → ${end.toISOString()}`)
      continue
    }

    // Déstructuration de la situation courante (ETP, fonction, catégorie, etc.)
    const { etp, fonction, category, activities } = currentSituation

    // Filtrage des indisponibilités qui affectent la période en cours
    const indispoInPeriod = indisponibilities.filter((i) => {
      const iStart = normalizeDate(i.dateStart)
      let iEnd
      if (i.dateStop) {
        iEnd = normalizeDate(i.dateStop)
        if (i.dateStart && i.dateStop && new Date(i.dateStart).getTime() === new Date(i.dateStop).getTime()) {
          iEnd = new Date(iEnd.getTime() + 24 * 60 * 60 * 1000) // Cas des indisponibilités d'une journée
        }
      } else {
        iEnd = agentEnd ? normalizeDate(agentEnd) : new Date(9999, 11, 31, 12)
      }
      return iStart < end && iEnd > start // Filtrer celles qui intersectent la période
    })

    // Calcul du taux d'indisponibilité total pendant cette période
    const totalIndispoRate = indispoInPeriod.reduce((sum, i) => {
      const rate = typeof i.percent === 'number' ? i.percent / 100 : i.rate || 0
      return sum + rate
    }, 0)

    // Calcul de l'ETP effectif en fonction des indisponibilités
    const effectiveETP = Math.max(0, etp * (1 - totalIndispoRate))

    // Vérification si la fin de la période est causée par une indisponibilité
    const isEndFromIndispoStop = indisponibilities.some((i) => {
      let iStop = i.dateStop ? normalizeDate(i.dateStop) : agentEnd ? normalizeDate(agentEnd) : new Date(9999, 11, 31, 12)
      if (i.dateStart && i.dateStop && new Date(i.dateStart).getTime() === new Date(i.dateStop).getTime()) {
        iStop = new Date(iStop.getTime() + 24 * 60 * 60 * 1000) // Si l'indisponibilité est d'un jour, on la prolonge d'un jour
      }
      return iStop.getTime() === end.getTime()
    })

    const isEndFromAgentDeparture = agentEnd && normalizeDate(agentEnd).getTime() === end.getTime()

    // Si la période n'est pas causée par une indisponibilité ou une fin d'agent, on ajuste la fin de la période
    if (!isEndFromIndispoStop && !isEndFromAgentDeparture) {
      end.setUTCDate(end.getUTCDate() - 1) // Réduire d'un jour pour éviter de dépasser la fin de la période
    }

    // Si la période précédente était due à une indisponibilité, on commence la période suivante au lendemain
    if (lastWasIndispoStop && !lastWasOneDayIndispoStop) {
      start.setUTCDate(start.getUTCDate() + 1)
    }
    lastWasOneDayIndispoStop = false
    lastWasIndispoStop = isEndFromIndispoStop // Met à jour la variable pour la prochaine période

    // Ajustement spécifique pour les indisponibilités d'une seule journée : fin de la période
    for (const indispo of indispoInPeriod) {
      const iStart = normalizeDate(indispo.dateStart)
      const iStop = normalizeDate(indispo.dateStop)
      if (iStart.getTime() === iStop.getTime()) {
        lastWasOneDayIndispoStop = true
        end = normalizeDate(iStart) // Fixe la fin de la période au même jour
        break
      }
    }

    // Si le début de la période est après la fin, on l'ignore
    if (start > end) {
      //console.warn(`⚠️ Période ignorée car start > end après ajustement: ${start.toISOString()} → ${end.toISOString()}`)
      continue
    }

    /**console.log(`✅ Période: ${start.toISOString()} → ${end.toISOString()}`)
    console.log('  Situation:', { etp, fonctionId: fonction?.id, categoryId: category?.id })
    console.log('  Indispos:', indispoInPeriod.length, '→ Rate:', totalIndispoRate)
    console.log('  Effective ETP:', effectiveETP)*/

    // Ajouter la période calculée dans la liste des périodes
    periods.push({
      agentId,
      start,
      end,
      etp,
      effectiveETP,
      fonction,
      category,
      activities,
      indisponibilities: indispoInPeriod,
    })
  }

  //console.log('📦 Résultat final:', periods)
  return periods // Retourner la liste des périodes générées
}

export const searchPeriodsWithIndexes = (
  intervalTree,
  categoryIndex,
  functionIndex,
  contentieuxIndex,
  queryStart,
  queryEnd,
  queryCategory,
  queryFonctions,
  queryContentieux,
) => {
  // Normaliser les dates de la requête
  const startDate = today(queryStart)
  const endDate = today(queryEnd)

  if (isNaN(startDate) || isNaN(endDate)) {
    console.error('Invalid start or end date.')
    return []
  }

  // Étape 1: Recherche des périodes par date avec l'Interval Tree
  const periodsByDate = intervalTree.search(startDate, endDate)
  //console.log('periodsByDate', periodsByDate.length)

  // Étape 2: Recherche des périodes par catégorie
  const periodsByCategory = queryCategory ? new Set(categoryIndex.get(queryCategory) || []) : new Set(periodsByDate.map((p) => p.periodId))
  //console.log('periodsByCategory', periodsByCategory.length)

  // Étape 3: Recherche des périodes par fonction
  const periodsByFunction =
    queryFonctions && queryFonctions.length > 0
      ? new Set(queryFonctions.flatMap((fonctionId) => functionIndex.get(fonctionId) || []))
      : new Set(periodsByDate.map((p) => p.periodId))
  //console.log('periodsByFunction', periodsByFunction.length)

  // Étape 4: Recherche des périodes par contentieux
  const periodsByContentieux = queryContentieux ? new Set(contentieuxIndex.get(queryContentieux) || []) : new Set(periodsByDate.map((p) => p.periodId))
  //console.log('periodsByContentieux', periodsByContentieux.length)

  // Étape 5: Filtrage des périodes en fonction des critères de catégorie, fonction et contentieux
  const filteredPeriods = periodsByDate.filter((period) => {
    // Vérification de l'inclusion des périodes par catégorie, fonction, contentieux
    const isInCategory = periodsByCategory.has(period.periodId)
    const isInFunction = periodsByFunction.has(period.periodId)
    const isInContentieux = periodsByContentieux.has(period.periodId)

    // Si tous les critères sont remplis, la période est valide
    return isInCategory && isInFunction && isInContentieux
  })
  //console.log('filteredPeriods', filteredPeriods.length)

  return filteredPeriods
}

export const calculateETPForContentieux = (
  intervalTree,
  categoryIndex,
  functionIndex,
  contentieuxIndex,
  queryStart,
  queryEnd,
  queryCategory,
  queryFonctions,
  queryContentieux,
  categories,
) => {
  // Recherche des périodes filtrées
  const filteredPeriods = searchPeriodsWithIndexes(
    intervalTree,
    categoryIndex,
    functionIndex,
    contentieuxIndex,
    queryStart,
    queryEnd,
    queryCategory,
    queryFonctions,
    queryContentieux,
  )

  // Pré-calculer les jours ouvrés dans la période de requête
  const nbOfWorkingDaysQuery = getWorkingDaysCount(queryStart, queryEnd)

  // Calculer l'ETP pour chaque période et totaliser l'ETP par catégorie
  const etpByCategory = categories.reduce((acc, category) => {
    acc[category.id] = 0
    return acc
  }, {})

  // Calcul de l'ETP pour chaque période filtrée
  filteredPeriods.forEach((period) => {
    const activityPercentage = period.activityIds.get(queryContentieux) || 0
    const effectiveETP = period.effectiveETP * (activityPercentage / 100)

    // Ajustement des dates en fonction de l'intervalle de requête
    const periodStart = Math.max(today(period.start), today(queryStart))
    const periodEnd = Math.min(today(period.end), today(queryEnd))

    // Nombre de jours ouvrés dans la période ajustée
    const workingDays = getWorkingDaysCount(periodStart, periodEnd)

    // Mise à jour de l'ETP par catégorie
    if (period.categoryId) {
      etpByCategory[period.categoryId] += (effectiveETP * workingDays) / nbOfWorkingDaysQuery
    }
  })

  // Retourner les résultats triés par rang de la catégorie
  return categories
    .map((category) => ({
      name: category.label,
      totalEtp: fixDecimal(etpByCategory[category.id] || 0, 1000),
      rank: category.rank,
    }))
    .sort((a, b) => a.rank - b.rank)
}
