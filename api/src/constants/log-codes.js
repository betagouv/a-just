export const USER_USER_SIGN_IN = 100
export const USER_USER_FORGOT_PASSWORD = 101
export const USER_REMOVE_HR = 103

export const ADMIN_CHANGE_USER_ACCESS = 200
export const ADMIN_REMOVE_HR = 201

export const CODES = {
  [USER_USER_SIGN_IN]: '[UTILISATEUR] Inscription utilisateur ${email}',
  [USER_USER_FORGOT_PASSWORD]: '[UTILISATEUR] Mot de passe oublié utilisateur ${email}',
  [USER_REMOVE_HR]: '[UTILISATEUR] Suppression de la resource ${hrId}',

  [ADMIN_CHANGE_USER_ACCESS]: '[ADMIN] Changement des droits de l\'utilisateur ${userId}',
  [ADMIN_REMOVE_HR]: '[ADMIN] Suppression de la resource ${hrId}',
}