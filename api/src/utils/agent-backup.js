/**
 * Un agent rattaché à ce backup y est compté s'il n'a aucune ventilation,
 * ou si au moins une ventilation est portée par ce backup.
 * Ventilé uniquement ailleurs, il ne fait pas partie de la liste de son backup d'accueil.
 * Une activité sans lieu explicite est portée par ce backup d'accueil.
 * @param {*} person
 * @param {number} backupId
 * @returns {boolean}
 */
export const agentCountsOnBackup = (person, backupId) => {
  const home = Number(person?.backupId)
  const current = Number(backupId)
  if (!Number.isFinite(home) || home !== current) return true

  let hasVentilation = false
  let ventilatedOnHome = false
  for (const situation of person?.situations || []) {
    for (const activity of situation.activities || []) {
      if (!Number(activity?.percent)) continue
      hasVentilation = true
      const activityBackup = activity?.backupId ?? activity?.backup?.id
      const id = activityBackup == null || activityBackup === '' ? home : Number(activityBackup)
      if (id === home) ventilatedOnHome = true
    }
  }

  if (!hasVentilation) return true
  return ventilatedOnHome
}

/**
 * Lieux de ventilation autres que le backup d'accueil.
 * @param {*} person
 * @returns {number[]}
 */
const ventilationBackupIdsOutsideHome = (person) => {
  const home = Number(person?.backupId)
  const ids = new Set()
  for (const situation of person?.situations || []) {
    for (const activity of situation.activities || []) {
      if (!Number(activity?.percent)) continue
      const activityBackup = activity?.backupId ?? activity?.backup?.id
      const id = activityBackup == null || activityBackup === '' ? home : Number(activityBackup)
      if (Number.isFinite(id) && id !== home) ids.add(id)
    }
  }
  return [...ids]
}

/**
 * Conserve l'agent dans le chargement d'un backup.
 * Absent de son accueil, il reste si la demande contient un lieu où il est ventilé.
 * @param {*} person
 * @param {number} backupId
 * @param {Set<number>} requestedBackupIds
 * @returns {boolean}
 */
export const agentKeptInBackupLoad = (person, backupId, requestedBackupIds) => {
  if (agentCountsOnBackup(person, backupId)) return true
  return ventilationBackupIdsOutsideHome(person).some((id) => requestedBackupIds.has(id))
}
