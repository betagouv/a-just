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
      return 'Panorama - lecture'
    case USER_ACCESS_DASHBOARD_WRITER:
      return 'Panorama - écriture'
    case USER_ACCESS_VENTILATIONS_READER:
      return 'Ventilations - lecture'
    case USER_ACCESS_VENTILATIONS_WRITER:
      return 'Ventilations - écriture'
    case USER_ACCESS_ACTIVITIES_READER:
      return "Données d'activité - lecture"
    case USER_ACCESS_ACTIVITIES_WRITER:
      return "Données d'activité - écriture"
    case USER_ACCESS_AVERAGE_TIME_READER:
      return 'Temps moyens - lecture'
    case USER_ACCESS_AVERAGE_TIME_WRITER:
      return 'Temps moyens - écriture'
    case USER_ACCESS_CALCULATOR_READER:
      return 'Cockpit - lecture'
    case USER_ACCESS_CALCULATOR_WRITER:
      return 'Cockpit - écriture'
    case USER_ACCESS_SIMULATOR_READER:
      return 'Simulateur - lecture'
    case USER_ACCESS_SIMULATOR_WRITER:
      return 'Simulateur - écriture'
    case USER_ACCESS_WHITE_SIMULATOR_READER:
      return 'Simulateur à blanc - lecture'
    case USER_ACCESS_WHITE_SIMULATOR_WRITER:
      return 'Simulateur à blanc - écriture'
    case USER_ACCESS_REAFFECTATOR_READER:
      return 'Réaffectateur - lecture'
    case USER_ACCESS_REAFFECTATOR_WRITER:
      return 'Réaffectateur - écriture'
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
    name: 'dashboard',
    label: 'Panorama',
    orderRequired: true,
    access: [
      {
        id: USER_ACCESS_DASHBOARD_READER,
        label: 'Lecture',
      },
      /*{
        id: USER_ACCESS_DASHBOARD_WRITER,
        label: 'Écriture',
      },*/
    ],
  },
  {
    name: 'ventilations',
    label: 'Ventilations',
    orderRequired: true,
    access: [
      {
        id: USER_ACCESS_VENTILATIONS_READER,
        label: 'Lecture',
      },
      {
        id: USER_ACCESS_VENTILATIONS_WRITER,
        label: 'Écriture',
      },
    ],
  },
  {
    name: 'activities',
    label: 'Activités',
    orderRequired: true,
    access: [
      {
        id: USER_ACCESS_ACTIVITIES_READER,
        label: 'Lecture',
      },
      {
        id: USER_ACCESS_ACTIVITIES_WRITER,
        label: 'Écriture',
      },
    ],
  },
  /*{
    name: 'average-time',
    label: 'Temps moyens',
    orderRequired: true,
    access: [
      {
        id: USER_ACCESS_AVERAGE_TIME_READER,
        label: 'Lecture',
      },
      {
        id: USER_ACCESS_AVERAGE_TIME_WRITER,
        label: 'Écriture',
      },
    ],
  },*/
  {
    name: 'calculator',
    label: 'Cockpit',
    orderRequired: true,
    access: [
      {
        id: USER_ACCESS_CALCULATOR_READER,
        label: 'Lecture',
      },
      /*{
        id: USER_ACCESS_CALCULATOR_WRITER,
        label: 'Écriture',
      },*/
    ],
  },
  {
    name: 'simulator',
    label: 'Simulateur',
    orderRequired: true,
    access: [
      {
        id: USER_ACCESS_SIMULATOR_READER,
        label: 'Lecture',
      },
      /*{
        id: USER_ACCESS_SIMULATOR_WRITER,
        label: 'Écriture',
      },*/
    ],
  },
  {
    name: 'white-simulator',
    label: 'Simulateur à blanc',
    orderRequired: true,
    access: [
      {
        id: USER_ACCESS_WHITE_SIMULATOR_READER,
        label: 'Lecture',
      },
      /*{
        id: USER_ACCESS_WHITE_SIMULATOR_WRITER,
        label: 'Écriture',
      },*/
    ],
  },
  {
    name: 'reaffectator',
    label: 'Réaffectateur',
    orderRequired: true,
    access: [
      {
        id: USER_ACCESS_REAFFECTATOR_READER,
        label: 'Lecture',
      },
      /*{
        id: USER_ACCESS_REAFFECTATOR_WRITER,
        label: 'Écriture',
      },*/
    ],
  },
  {
    name: 'groups',
    label: "Typologie d'agents",
    orderRequired: false,
    access: [
      {
        id: HAS_ACCESS_TO_MAGISTRAT,
        label: 'Accès aux magistrats',
      },
      {
        id: HAS_ACCESS_TO_GREFFIER,
        label: 'Accès aux greffiers',
      },
      {
        id: HAS_ACCESS_TO_CONTRACTUEL,
        label: 'Accès aux contractuels',
      },
    ],
  },
]
