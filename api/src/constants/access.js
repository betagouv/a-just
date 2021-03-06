export const USER_ACCESS_DASHBOARD = 1 // Dashboard
export const USER_ACCESS_VENTILATIONS = 2 // Ventilations
export const USER_ACCESS_ACTIVITIES = 3 // Données d'activité
export const USER_ACCESS_AVERAGE_TIME = 4 // Temps moyens
export const USER_ACCESS_CALCULATOR = 5 // Calculateur
export const USER_ACCESS_SIMULATOR = 6 // Simulateur
export const USER_ACCESS_REAFFECTATOR = 7 // Réaffectateur

export const accessToString = (roleId) => {
  switch(roleId) {
  case USER_ACCESS_DASHBOARD:
    return 'Tableau de board'
  case USER_ACCESS_VENTILATIONS:
    return 'Ventilations'
  case USER_ACCESS_ACTIVITIES:
    return 'Données d\'activité'
  case USER_ACCESS_AVERAGE_TIME:
    return 'Temps moyens'
  case USER_ACCESS_CALCULATOR:
    return 'Calculateur'
  case USER_ACCESS_SIMULATOR:
    return 'Simulateur'
  case USER_ACCESS_REAFFECTATOR:
    return 'Réaffectateur'
  }
}

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
    id: USER_ACCESS_REAFFECTATOR,
    label: accessToString(USER_ACCESS_REAFFECTATOR),
  },
]