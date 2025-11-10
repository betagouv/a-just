/**
 * Tracage des logs du serveur
 */

export const USER_USER_SIGN_IN = 100
export const USER_USER_FORGOT_PASSWORD = 101
export const USER_REMOVE_HR = 103
export const USER_USER_LOGIN = 104
export const USER_AUTO_LOGIN = 105
export const USER_USER_LOGIN_CODE_INVALID = 106
export const USER_USER_LOGIN_REQUEST_CODE = 107
export const USER_AUTH_BY_2FA = 108
export const USER_USER_PASSWORD_CHANGED = 109

export const ADMIN_CHANGE_USER_ACCESS = 200
export const ADMIN_REMOVE_HR = 201

export const EXECUTE_VENTILATION = 300

export const EXECUTE_CALCULATOR = 301
export const EXECUTE_CALCULATOR_CHANGE_DATE = 3011
export const CALCULATOR_SELECT_GREFFE = 3012
export const CALCULATOR_OPEN_CONTENTIEUX = 3013
export const CALCULATOR_OPEN_CONMPARAISON_RANGE = 3014
export const CALCULATOR_OPEN_CONMPARAISON_REFERENTIEL = 3015
export const CALCULATOR_OPEN_CHARTS_VIEW = 3016
export const CALCULATOR_OPEN_DETAILS_IN_CHARTS_VIEW = 3017
export const CALCULATOR_OPEN_POPIN_GRAPH_DETAILS = 3018

export const EXECUTE_SIMULATION = 302
export const EXECUTE_LAUNCH_SIMULATOR = 310
export const EXECUTE_REAFFECTATOR = 303
export const EXECUTE_EXTRACTOR = 304
export const EXECUTE_HELPCENTER = 305
export const EXECUTE_HELPCENTER_LINK = 306
export const EXECUTE_HELPCENTER_SEARCH = 307
export const EXECUTE_WHITE_SIMULATOR = 312
export const EXECUTE_LAUNCH_WHITE_SIMULATOR = 313
export const EXECUTE_SIMULATOR_PARAM = 315

export const HUMAN_RESOURCE_PAGE_LOAD = 316
export const HUMAN_RESOURCE_NEW_SITUATION_SAVED = 317
export const HUMAN_RESOURCE_SITUATION_UPDATED = 318

export const START_DATE_SIMULATOR = 350
export const END_DATE_SIMULATOR = 351
export const DATE_REAFECTATOR = 352
export const DATE_WHITE_SIMULATOR = 353

export const HELP_START = 400
export const HELP_STOP = 401
export const HELP_AUTOSTART = 402
export const HELP_AUTOSTART_AND_STOP = 403

export const ACTIVITIES_PAGE_LOAD = 500
export const ACTIVITIES_CHANGE_DATE = 501
export const ACTIVITIES_SHOW_LEVEL_4 = 502

export const HONEY_IP_TRAPPED = 10001
export const HONEY_IP_BLOCK_AGAIN = 10002

export const REFERENCE_REQUEST_URL = 10003

export const WHITE_SIMULATOR_START = 20000

export const REQUET_HELP_PAGE = 30000
export const REQUEST_USER_MANUAL = 30001

export const REAFFECTOR_UPDATE_AGENT = 40000

export const CODES = {
  [USER_USER_SIGN_IN]: '[UTILISATEUR] Inscription utilisateur ${email}',
  [USER_USER_FORGOT_PASSWORD]: '[UTILISATEUR] Mot de passe oublié utilisateur ${email}',
  [USER_REMOVE_HR]: '[UTILISATEUR] Suppression de la resource ${hrId}',
  [USER_USER_LOGIN]: '[UTILISATEUR] Utilisateur vient de se connecter, id = ${userId}',
  [USER_AUTO_LOGIN]: '[UTILISATEUR] Utilisateur vient de se reconnecter, id = ${userId}',

  [ADMIN_CHANGE_USER_ACCESS]: "[ADMIN] Changement des droits de l'utilisateur ${userId}",
  [ADMIN_REMOVE_HR]: '[ADMIN] Suppression de la resource ${hrId}',

  [EXECUTE_VENTILATION]: '[UTILISATEUR] Un utilisateur vient de charger le ventilateur',
  [EXECUTE_CALCULATOR]: '[UTILISATEUR] Un utilisateur vient de réaliser un calcul',
  [EXECUTE_CALCULATOR_CHANGE_DATE]: "[UTILISATEUR] Un utilisateur vient de réaliser un calcul et à changé la date au lieu d'aujourd'hui",

  [CALCULATOR_SELECT_GREFFE]: '[UTILISATEUR] Un utilisateur vient de selectionner la catégorie Greffe dans le cockpit',
  [CALCULATOR_OPEN_CONTENTIEUX]: '[UTILISATEUR] Un utilisateur vient de dérouler un contentieux dans la vue données brutes du cockpit',
  [CALCULATOR_OPEN_CONMPARAISON_RANGE]: "[UTILISATEUR] Un utilisateur vient d'effectuer une comparaison avec une autre période de temps via le cockpit",
  [CALCULATOR_OPEN_CONMPARAISON_REFERENTIEL]: "[UTILISATEUR] Un utilisateur vient d'effectuer une comparaison avec un référentiel de temps via le cockpit",
  [CALCULATOR_OPEN_CHARTS_VIEW]: "[UTILISATEUR] Un utilisateur vient d'ouvrir la vue graphique dans le cockpit",
  [CALCULATOR_OPEN_DETAILS_IN_CHARTS_VIEW]: "[UTILISATEUR] Un utilisateur vient d'afficher les détails dans la vue graphique du cockpit",
  [CALCULATOR_OPEN_POPIN_GRAPH_DETAILS]: "[UTILISATEUR] Un utilisateur vient d'ouvrir la popin des détails du graphique dans le cockpit",

  [EXECUTE_SIMULATION]: '[UTILISATEUR] Un utilisateur vient d ouvrir le simulateur',
  [EXECUTE_REAFFECTATOR]: '[UTILISATEUR] Un utilisateur vient de réaliser une réaffectation',
  [EXECUTE_EXTRACTOR]: '[UTILISATEUR] Un utilisateur vient de réaliser un extracteur',
  [EXECUTE_HELPCENTER]: "[UTILISATEUR] Un utilisateur vient d'ouvrir le centre d'aide",
  [EXECUTE_HELPCENTER_SEARCH]: "[UTILISATEUR] Un utilisateur vient de faire une recherche dans le centre d'aide",
  [EXECUTE_HELPCENTER_LINK]: "[UTILISATEUR] Un utilisateur vient d'ouvrir une ressource du centre d'aide",
  [EXECUTE_WHITE_SIMULATOR]: '[UTILISATEUR] Un utilisateur vient d ouvrir le simulateur à blanc',
  [EXECUTE_LAUNCH_WHITE_SIMULATOR]: '[UTILISATEUR] Un utilisateur vient de réaliser une simulation à blanc',
  [EXECUTE_LAUNCH_SIMULATOR]: '[UTILISATEUR] Un utilisateur vient de réaliser une simulation',
  [EXECUTE_SIMULATOR_PARAM]: '[UTILISATEUR] Un utilisateur vient de réaliser une simulation avec des parametres',
  [HUMAN_RESOURCE_PAGE_LOAD]: "[UTILISATEUR] Un utilisateur vient d'ouvrir une fiche agent",
  [HUMAN_RESOURCE_NEW_SITUATION_SAVED]: "[UTILISATEUR] Enregistrement de nouvelle situation",
  [HUMAN_RESOURCE_SITUATION_UPDATED]: "[UTILISATEUR] Modification d'une situation existante",
  [START_DATE_SIMULATOR]: '[UTILISATEUR] Un utilisateur vient de changer la date de début dans le simulateur normal',
  [END_DATE_SIMULATOR]: '[UTILISATEUR] Un utilisateur vient de changer la date de fin dans le simulateur normal',
  [DATE_REAFECTATOR]: '[UTILISATEUR] Un utilisateur vient de changer la date dans le réaffectateur',
  [DATE_WHITE_SIMULATOR]: '[UTILISATEUR] Un utilisateur vient de changer la date de fin dans le simulateur à blanc',
}
