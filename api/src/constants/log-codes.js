/**
 * Tracage des logs du serveur
 */

export const USER_USER_SIGN_IN = 100
export const USER_USER_FORGOT_PASSWORD = 101
export const USER_REMOVE_HR = 103
export const USER_USER_LOGIN = 104
export const USER_AUTO_LOGIN = 105

export const ADMIN_CHANGE_USER_ACCESS = 200
export const ADMIN_REMOVE_HR = 201

export const EXECUTE_VENTILATION = 300
export const EXECUTE_CALCULATOR = 301
export const EXECUTE_SIMULATION = 302
export const EXECUTE_REAFFECTATOR = 303
export const EXECUTE_EXTRACTOR = 304

export const CODES = {
  [USER_USER_SIGN_IN]: '[UTILISATEUR] Inscription utilisateur ${email}',
  [USER_USER_FORGOT_PASSWORD]: '[UTILISATEUR] Mot de passe oublié utilisateur ${email}',
  [USER_REMOVE_HR]: '[UTILISATEUR] Suppression de la resource ${hrId}',
  [USER_USER_LOGIN]: '[UTILISATEUR] Utilisateur vient de se connecter, id = ${userId}',
  [USER_AUTO_LOGIN]: '[UTILISATEUR] Utilisateur vient de se reconnecter, id = ${userId}',

  [ADMIN_CHANGE_USER_ACCESS]: "[ADMIN] Changement des droits de l'utilisateur ${userId}",
  [ADMIN_REMOVE_HR]: '[ADMIN] Suppression de la resource ${hrId}',

  [EXECUTE_VENTILATION]: '[UTILISATEUR] Un utilisateur vient de réaliser une ventilation',
  [EXECUTE_CALCULATOR]: '[UTILISATEUR] Un utilisateur vient de réaliser un calcul',
  [EXECUTE_SIMULATION]: '[UTILISATEUR] Un utilisateur vient de réaliser une simulation',
  [EXECUTE_REAFFECTATOR]: '[UTILISATEUR] Un utilisateur vient de réaliser une réaffectation',
  [EXECUTE_EXTRACTOR]: '[UTILISATEUR] Un utilisateur vient de réaliser un extracteur',
}
