/**
 * Constante id d'accés au dasboard
 */
export const USER_ACCESS_DASHBOARD_READER = 1.1
/**
 * Constante id d'accés au dasboard
 */
export const USER_ACCESS_DASHBOARD_WRITER = 1.2
/**
 * Constante id d'accés au ventilateur
 */
export const USER_ACCESS_VENTILATIONS_READER = 2.1
/**
 * Constante id d'accés au ventilateur
 */
export const USER_ACCESS_VENTILATIONS_WRITER = 2.2
/**
 * Constante id d'accés au données d'activité
 */
export const USER_ACCESS_ACTIVITIES_READER = 3.1
/**
 * Constante id d'accés au données d'activité
 */
export const USER_ACCESS_ACTIVITIES_WRITER = 3.2
/**
 * Constante id d'accés au temps moyens
 */
export const USER_ACCESS_AVERAGE_TIME_READER = 4.1
/**
 * Constante id d'accés au temps moyens
 */
export const USER_ACCESS_AVERAGE_TIME_WRITER = 4.2
/**
 * Constante id d'accés au calculateur
 */
export const USER_ACCESS_CALCULATOR_READER = 5.1
/**
 * Constante id d'accés au calculateur
 */
export const USER_ACCESS_CALCULATOR_WRITER = 5.2
/**
 * Constante id d'accés au simulateur
 */
export const USER_ACCESS_SIMULATOR_READER = 6.1
/**
 * Constante id d'accés au simulateur
 */
export const USER_ACCESS_SIMULATOR_WRITER = 6.2
/**
 * Constante id d'accés au simulateur
 */
export const USER_ACCESS_WHITE_SIMULATOR_READER = 61.1
/**
 * Constante id d'accés au simulateur à blanc
 */
export const USER_ACCESS_WHITE_SIMULATOR_WRITER = 61.2
/**
 * Constante id d'accés au réaffectateur
 */
export const USER_ACCESS_REAFFECTATOR_READER = 7.1
/**
 * Constante id d'accés au réaffectateur
 */
export const USER_ACCESS_REAFFECTATOR_WRITER = 7.2
/**
 * Constante id d'accés aux magistrats
 */
export const HAS_ACCESS_TO_MAGISTRAT = 8
/**
 * Constante id d'accés aux fonctionnaires
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
    case USER_ACCESS_DASHBOARD_READER:
      return 'Panorama en mode lecture'
    case USER_ACCESS_DASHBOARD_WRITER:
      return 'Panorama en mode écriture'
    case USER_ACCESS_VENTILATIONS_READER:
      return 'Ventilations en mode lecture'
    case USER_ACCESS_VENTILATIONS_WRITER:
      return 'Ventilations en mode écriture'
    case USER_ACCESS_ACTIVITIES_READER:
      return "Données d'activité en mode lecture"
    case USER_ACCESS_ACTIVITIES_WRITER:
      return "Données d'activité en mode écriture"
    case USER_ACCESS_AVERAGE_TIME_READER:
      return 'Temps moyens en mode lecture'
    case USER_ACCESS_AVERAGE_TIME_WRITER:
      return 'Temps moyens en mode écriture'
    case USER_ACCESS_CALCULATOR_READER:
      return 'Cockpit en mode lecture'
    case USER_ACCESS_CALCULATOR_WRITER:
      return 'Cockpit en mode écriture'
    case USER_ACCESS_SIMULATOR_READER:
      return 'Simulateur en mode lecture'
    case USER_ACCESS_SIMULATOR_WRITER:
      return 'Simulateur en mode écriture'
    case USER_ACCESS_WHITE_SIMULATOR_READER:
      return 'Simulateur à blanc en mode lecture'
    case USER_ACCESS_WHITE_SIMULATOR_WRITER:
      return 'Simulateur à blanc en mode écriture'
    case USER_ACCESS_REAFFECTATOR_READER:
      return 'Réaffectateur en mode lecture'
    case USER_ACCESS_REAFFECTATOR_WRITER:
      return 'Réaffectateur en mode écriture'
    case HAS_ACCESS_TO_MAGISTRAT:
      return 'Accès aux magistrats'
    case HAS_ACCESS_TO_GREFFIER:
      return 'Accès aux greffier'
    case HAS_ACCESS_TO_CONTRACTUEL:
      return 'Accès aux contractuel'
  }
}

/**
 * Liste des accès possible
 */
export const accessList = [
  {
    id: USER_ACCESS_DASHBOARD_READER,
    label: accessToString(USER_ACCESS_DASHBOARD_READER),
  },
  {
    id: USER_ACCESS_DASHBOARD_WRITER,
    label: accessToString(USER_ACCESS_DASHBOARD_WRITER),
  },
  {
    id: USER_ACCESS_VENTILATIONS_READER,
    label: accessToString(USER_ACCESS_VENTILATIONS_READER),
  },
  {
    id: USER_ACCESS_VENTILATIONS_WRITER,
    label: accessToString(USER_ACCESS_VENTILATIONS_WRITER),
  },
  {
    id: USER_ACCESS_ACTIVITIES_READER,
    label: accessToString(USER_ACCESS_ACTIVITIES_READER),
  },
  {
    id: USER_ACCESS_ACTIVITIES_WRITER,
    label: accessToString(USER_ACCESS_ACTIVITIES_WRITER),
  },
  {
    id: USER_ACCESS_AVERAGE_TIME_READER,
    label: accessToString(USER_ACCESS_AVERAGE_TIME_READER),
  },
  {
    id: USER_ACCESS_AVERAGE_TIME_WRITER,
    label: accessToString(USER_ACCESS_AVERAGE_TIME_WRITER),
  },
  {
    id: USER_ACCESS_CALCULATOR_READER,
    label: accessToString(USER_ACCESS_CALCULATOR_READER),
  },
  {
    id: USER_ACCESS_CALCULATOR_WRITER,
    label: accessToString(USER_ACCESS_CALCULATOR_WRITER),
  },
  {
    id: USER_ACCESS_SIMULATOR_READER,
    label: accessToString(USER_ACCESS_SIMULATOR_READER),
  },
  {
    id: USER_ACCESS_SIMULATOR_WRITER,
    label: accessToString(USER_ACCESS_SIMULATOR_WRITER),
  },
  {
    id: USER_ACCESS_WHITE_SIMULATOR_READER,
    label: accessToString(USER_ACCESS_WHITE_SIMULATOR_READER),
  },
  {
    id: USER_ACCESS_WHITE_SIMULATOR_WRITER,
    label: accessToString(USER_ACCESS_WHITE_SIMULATOR_WRITER),
  },
  {
    id: USER_ACCESS_REAFFECTATOR_READER,
    label: accessToString(USER_ACCESS_REAFFECTATOR_READER),
  },
  {
    id: USER_ACCESS_REAFFECTATOR_WRITER,
    label: accessToString(USER_ACCESS_REAFFECTATOR_WRITER),
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
