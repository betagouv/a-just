export const basicEtptData = {
  /**
     * Nombre de jour travaillé / an d'un magistrat
     */
  nbDaysByMagistrat: 208,
  /**
   * Nombre de jour travaillé / an d'un fonctionnaire
   */
  nbDaysByFonctionnaire: 229.57, // 1607 heures / an
  /**,
   * Nombre d'heure par jour de travail d'un magistrat
   */
  nbHoursPerDayAndMagistrat: 8,
  /**
   * Nombre d'heure par jour de travail d'un fonctionnaire
   */
  nbHoursPerDayAndFonctionnaire: 7,  
  }

/**
 * Données de calcul d'ETPT
 */
export const etptData = {
  nbDaysByMagistrat: basicEtptData.nbDaysByMagistrat,
  nbDaysPerMonthByMagistrat: basicEtptData.nbDaysByMagistrat / 12,
  nbHoursPerDayAndByMagistrat: basicEtptData.nbHoursPerDayAndMagistrat,
  nbDaysByFonctionnaire: 229.57,
  nbDaysPerMonthByFonctionnaire: 229.57 / 12,
  nbHoursPerDayAndByFonctionnaire: 7,
  nbDaysByContractuel: 229.57,
  nbDaysPerMonthByContractuel: 229.57 / 12,
  nbHoursPerDayAndByContractuel: 7,
}
