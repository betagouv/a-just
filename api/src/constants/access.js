/**
 * Constante id d'accés au dasboard
 */
export const USER_ACCESS_DASHBOARD = 1
/**
 * Constante id d'accés au ventilateur
 */
export const USER_ACCESS_VENTILATIONS = 2
/**
 * Constante id d'accés au données d'activité
 */
export const USER_ACCESS_ACTIVITIES = 3
/**
 * Constante id d'accés au temps moyens
 */
export const USER_ACCESS_AVERAGE_TIME = 4
/**
 * Constante id d'accés au calculateur
 */
export const USER_ACCESS_CALCULATOR = 5
/**
 * Constante id d'accés au simulateur
 */
export const USER_ACCESS_SIMULATOR = 6
/**
 * Constante id d'accés au simulateur
 */
export const USER_ACCESS_WHITE_SIMULATOR = 61
/**
 * Constante id d'accés au réaffectateur
 */
export const USER_ACCESS_REAFFECTATOR = 7
/**
 * Constante d'accès aux magistrats
 */
export const HAS_ACCESS_TO_MAGISTRAT = 8
/**
 * Constante d'accès aux fonctionnaires
 */
export const HAS_ACCESS_TO_GREFFIER = 9
/**
 * Constante d'accès aux contractuels
 */
export const HAS_ACCESS_TO_CONTRACTUEL = 10

/**
 * Conversion d'un accessId en string
 * @param {*} roleId
 * @returns
 */
export const accessToString = (roleId) => {
  switch (roleId) {
  case USER_ACCESS_DASHBOARD:
    return 'Panorama'
  case USER_ACCESS_VENTILATIONS:
    return 'Ventilations'
  case USER_ACCESS_ACTIVITIES:
    return "Données d'activité"
  case USER_ACCESS_AVERAGE_TIME:
    return 'Temps moyens'
  case USER_ACCESS_CALCULATOR:
    return 'Cockpit'
  case USER_ACCESS_SIMULATOR:
    return 'Simulateur'
  case USER_ACCESS_WHITE_SIMULATOR:
    return 'Simulateur à blanc'
  case USER_ACCESS_REAFFECTATOR:
    return 'Réaffectateur'
  case HAS_ACCESS_TO_MAGISTRAT:
    return 'Accès aux magistrats'
  case HAS_ACCESS_TO_GREFFIER:
    return 'Accès aux greffier'
  case HAS_ACCESS_TO_CONTRACTUEL:
    return 'Accès aux contractuels'
  }
}

/**
 * Liste des accès possible
 */
export const accessList = [
  {
    id: USER_ACCESS_DASHBOARD,
    label: accessToString(USER_ACCESS_DASHBOARD),
  },
  {
    id: USER_ACCESS_VENTILATIONS,
    label: accessToString(USER_ACCESS_VENTILATIONS),
  },
  {
    id: USER_ACCESS_ACTIVITIES,
    label: accessToString(USER_ACCESS_ACTIVITIES),
  },
  {
    id: USER_ACCESS_AVERAGE_TIME,
    label: accessToString(USER_ACCESS_AVERAGE_TIME),
  },
  {
    id: USER_ACCESS_CALCULATOR,
    label: accessToString(USER_ACCESS_CALCULATOR),
  },
  {
    id: USER_ACCESS_SIMULATOR,
    label: accessToString(USER_ACCESS_SIMULATOR),
  },
  {
    id: USER_ACCESS_WHITE_SIMULATOR,
    label: accessToString(USER_ACCESS_WHITE_SIMULATOR),
  },
  {
    id: USER_ACCESS_REAFFECTATOR,
    label: accessToString(USER_ACCESS_REAFFECTATOR),
  },
  {
    id: HAS_ACCESS_TO_MAGISTRAT,
    label: accessToString(HAS_ACCESS_TO_MAGISTRAT),
  },
  {
    id: HAS_ACCESS_TO_GREFFIER,
    label: accessToString(HAS_ACCESS_TO_GREFFIER),
  },
  {
    id: HAS_ACCESS_TO_CONTRACTUEL,
    label: accessToString(HAS_ACCESS_TO_CONTRACTUEL),
  },
]
