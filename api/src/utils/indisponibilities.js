import { orderBy } from 'lodash'
import { getWorkingDaysCount, today } from './date'

/**
 * Récupère toutes les indisponibilités
 * @param {*} hr
 * @param {*} date
 * @returns
 */
export const findAllIndisponibilities = (hr, date) => {
  let indisponibilities = orderBy(
    hr.indisponibilities || [],
    [
      function (o) {
        const date = o.dateStart ? new Date(o.dateStart) : new Date()
        return date.getTime()
      },
    ],
    ['desc'],
  )

  if (date) {
    date = today(date)
    indisponibilities = indisponibilities.filter((hra) => {
      const dateStart = today(hra.dateStart)

      if (date && dateStart.getTime() <= date.getTime()) {
        if (hra.dateStop) {
          const dateStop = today(hra.dateStop)
          if (dateStop.getTime() >= date.getTime()) {
            return true
          }
        } else {
          // return true if they are no end date
          return true
        }
      }

      return false
    })
  }

  return indisponibilities
}

/**
 * Retourne toutes les indispos d'un agent pour un type (contentieux) donné
 * qui chevauchent la fenêtre [queryStart, queryEnd), en bornant les résultats
 * et en stockant dateStart/dateStop comme valeurs numériques (today()).
 *
 * @param {*} indexes                       // indexes retourné par generateAndIndexAllStableHRPeriods
 * @param {string} queryStart
 * @param {string} queryEnd
 * @param {number} agentId
 * @param {number} indispoContentieuxId     // contentieux.id de l'indispo
 * @returns {Array<Object>}                 // enregistrements avec dateStart/dateStop = numbers
 */
export const searchAgentIndisposWithIndexes = (indexes, queryStart, queryEnd, agentId, indispoContentieuxId) => {
  const qStart = today(queryStart)
  const qEnd = today(queryEnd)
  if (isNaN(qStart) || isNaN(qEnd) || qEnd <= qStart) return []

  const { indispoDatabase, agentIndispoIndex, indispoTypeIndex } = indexes || {}
  if (!indispoDatabase || !agentIndispoIndex || !indispoTypeIndex) return []

  const byAgent = agentIndispoIndex.get(agentId) || []
  const byType = indispoTypeIndex.get(indispoContentieuxId) || []
  if (byAgent.length === 0 || byType.length === 0) return []

  const small = byAgent.length <= byType.length ? byAgent : byType
  const bigSet = new Set(byAgent.length <= byType.length ? byType : byAgent)

  const out = []
  for (let i = 0; i < small.length; i++) {
    const id = small[i]
    if (!bigSet.has(id)) continue

    const rec = indispoDatabase.get(id)
    if (!rec) continue

    // bornes originales (toujours via today)
    if (!rec.dateStop) rec.dateStop = new Date(9999, 11, 31, 12)
    const rStart = today(rec.dateStart ?? rec.start)
    const rEnd = today(rec.dateStop ?? rec.end)
    if (isNaN(rStart) || isNaN(rEnd)) continue

    // pas de chevauchement -> skip
    if (rEnd <= qStart || rStart >= qEnd) continue

    // bornage à la fenêtre [qStart, qEnd)
    const bs = Math.max(rStart, qStart)
    const be = Math.min(rEnd, qEnd)
    // push en stockant dateStart/dateStop
    out.push({
      id: rec.id,
      percent: rec.percent,
      dateStart: today(bs),
      dateStop: today(be),
      //createdAt: rec.createdAt,
      //updatedAt: rec.updatedAt,
      contentieux: rec.contentieux,
      agentId: rec.agentId,
    })
  }

  // Tri par début croissant (déjà des nombres)
  out.sort((a, b) => a.dateStart - b.dateStart)
  return out
}

/**
 * Calcule le nombre total de jours ouvrés couverts par un ensemble d'indispos,
 * sans double-compter les chevauchements.
 *
 * @param {Array<{dateStart:number, dateStop:number}>} indispos
 * @returns {number} nombre total de jours ouvrés couverts
 */
export const getWorkingDaysFromIndispos = (indispos) => {
  if (!Array.isArray(indispos) || indispos.length === 0) return 0

  // 1) Trier les indispos par dateStart
  const sorted = [...indispos].sort((a, b) => a.dateStart - b.dateStart)

  // 2) Fusionner les intervalles qui se chevauchent
  const merged = []
  let currentStart = sorted[0].dateStart
  let currentEnd = sorted[0].dateStop

  for (let i = 1; i < sorted.length; i++) {
    const { dateStart, dateStop } = sorted[i]
    if (dateStart <= currentEnd) {
      // chevauchement → étendre l’intervalle
      currentEnd = Math.max(currentEnd, dateStop)
    } else {
      // pas de chevauchement → stocker le précédent
      merged.push({ start: currentStart, end: currentEnd })
      currentStart = dateStart
      currentEnd = dateStop
    }
  }
  merged.push({ start: currentStart, end: currentEnd })

  // 3) Additionner les jours ouvrés de chaque intervalle fusionné
  let totalWorkingDays = 0
  merged.forEach(({ start, end }) => {
    totalWorkingDays += getWorkingDaysCount(start, end)
  })

  return totalWorkingDays
}
