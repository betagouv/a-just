export const USER_ACCESS_DASHBOARD = 1 // Dashboard
export const USER_ACCESS_VENTILATIONS = 2 // Ventilations
export const USER_ACCESS_ACTIVITIES = 3 // Données d'activité
export const USER_ACCESS_AVERAGE_TIME = 4 // Temps moyens
export const USER_ACCESS_CALCULATOR = 5 // Calculateur
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
  }
}