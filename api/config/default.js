import 'dotenv/config'

module.exports = {
  isDev: false,
  /**
   * String pour préfixer le nom de l'environement (idéal pour les mails de test)
   */
  envName: '',
  /**
   * String pour préfixer le nom de l'environement (idéal pour les mails de test)
   */
  displayEnvName: '',
  /**
   * Url du serveur (idéal pour le contenu des mails)
   */
  serverUrl: process.env.SERVER_URL || 'http://localhost:8081/api',
  /**
   * Url du font (idéal pour le contenu des mails)
   */
  frontUrl: process.env.FRONT_URL || 'http://localhost:4200',
  /**
   * Url du cors
   */
  corsUrl: [
    process.env.FRONT_URL,
    process.env.SERVER_URL,
    'https://aide.a-just-ca.beta.gouv.fr',
    'https://aide.a-just.incubateur.net',
    'https://aide.a-just-ca.incubateur.net',
    'https://aide.a-just.beta.gouv.fr',
    'https://nantes.sso.intranet.justice.gouv.fr',
  ],
  /**
   * Port utilisé pour démarrer le serveur
   */
  port: process.env.PORT || 8081,
  /**
   * Path de la base
   */
  database: {
    url: process.env.DATABASE_URL,
    logging: (msg) => console.log(msg),
    //logging: false,
  },
  /**
   * Code du cryptage JWT
   */
  jsonwebtoken: {
    private_key: process.env.JSON_WEB_TOKEN,
  },
  /**
   * Clé API de sendinblue
   */
  sendinblue: process.env.SENDINBLUE,
  /**
   * Mot de passe de connexion à la partie LOGS
   */
  logsPassword: process.env.LOGS_PASSWORD,
  /**
   * Email du support
   */
  supportEmail: process.env.SUPPORT_EMAIL,
  /**
   * Préchargement de toutes les jurictions ? (Prend 30s et de la mémoire)
   */
  preloadHumanResourcesDatas: false,
  /**
   * Variable url redis
   */
  redis: process.env.REDIS_URL,
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
  /**
   * Id de la liste des utilisateurs dans sendingblue
   */
  sendingBlue: {
    usersListId: 6,
  },
  /**
   * Nombre de jours d'inactivité maximum des comptes
   */
  nbMaxDayCanBeInactive: 30,
  /**
   * Sentry api Key
   */
  sentryApi: process.env.SENTRY_API,
  /**
   * Sent Email
   */
  sentEmail: true,
  /**
   * Juridiction type
   */
  juridictionType: process.env.TYPE_ID || 0,
  /**
   * Token expiration delay
   */
  nbMinDayTokenLife: 7,
  /**
   * Force HTTP to HTTPS
   */
  forceSSL: false,
  /**
   * Securities rules
   */
  securities: {
    /**
     * Securities about the user connected
     */
    users: {
      /**
       * Max essai de connection après blockage
       */
      nbMaxTryConnection: 5,
      /**
       * Tranche min d'essais de connection
       */
      nbMaxDelayAboutTryConnection: 10, // 10 minutes,
      /**
       * Delai de blockage d'un compte
       */
      delaiAboutLockConnection: 5, // 5 minutes,
    },
  },
  /**
   * Limite le nombre de requete en 5 min
   */
  maxQueryLimit: 1000,
  /**
   * Force to format logs
   */
  formatLogs: false,
  /**
   * TOKEN Hubspot
   */
  hubspotToken: process.env.HUBSPOT_TOKEN,
  /**
   * SSO URL
   */
  sso: {
    url: process.env.SSO_URL,
    testUrl: process.env.SSO_TEST_URL,
    privateKey: process.env.SSO_PRIVATE_KEY,
    publicKey: process.env.SSO_PUBLIC_KEY,
    ssoExternalPublicKey: process.env.SSO_EXTERNAL_PUBLIC_KEY,
    ssoExternalPrivateKey: process.env.SSO_EXTERNAL_PRIVATE_KEY,
  },
  login: {
    shareAuthCode: false,
    enable2Auth: false,
    max2AuthByMonth: 1,
  },
  /**
   * SESSION CONFIG
   */
  session: {
    key: 'koa.sess' /** (string) cookie key (default is koa.sess) */,
    /** (number || 'session') maxAge in ms (default is 1 days) */
    /** 'session' will result in a cookie that expires when session/browser is closed */
    /** Warning: If a session cookie is stolen, this cookie will never expire */
    maxAge: 86400000,
    autoCommit: true /** (boolean) automatically commit headers (default true) */,
    overwrite: true /** (boolean) can overwrite or not (default true) */,
    httpOnly: true /** (boolean) httpOnly or not (default true) */,
    signed: true /** (boolean) signed or not (default true) */,
    rolling: false,
    renew: false /** (boolean) renew session when session is nearly expired, so we can always keep user logged in. (default is false)*/,
    secure: true /** (boolean) secure cookie*/,
    sameSite: null /** (string) session cookie sameSite options (default null, don't set it) */,
  },
  redis: process.env.REDIS_URL || null,
  // USER AGENT TO honey tracp
  useAgent: process.env.AUTHORIZED_AGENTS,
  // IP to block
  ipFilter: {
    whitelist: [
      // https://bgp.he.net/AS60855#_prefixes IPs des ministères
      '143.126.100.',
      '143.126.203.',
      '143.126.211.',
      '143.126.221.',
      '143.126.248.',
      '143.126.248.',
      '143.126.249.',
      '143.126.250.',
      '143.126.250.',
      '143.126.251.',
      '143.126.255.',
      '143.196.14.',
      '143.196.22.',
      '143.196.22.',
      '143.196.23.',
      '143.196.146.',
      '143.196.146.',
      '143.196.147.',
      '143.196.148.',
      '143.196.176.',
      '143.196.187.',
      '143.196.251.',
      '143.196.255.',
      '164.131.80.',
      '164.131.124.',
      '164.131.124.',
      '164.131.125.',
      '164.131.126.',
      '164.131.126.',
      '164.131.127.',
      '164.131.130.',
      '164.131.130.',
      '164.131.131.',
      '164.131.132.',
      '164.131.132.',
      '164.131.133.',
      '164.131.142.',
      '164.131.142.',
      '164.131.143.',
      '164.131.160.',
      '164.131.197.',
      '164.131.198.',
      '164.131.198.',
      '164.131.199.',
      '164.131.212.',
      '164.131.214.',
      '164.131.224.',
      '164.131.226.',
      '164.131.232.',
      '164.131.233.',
      '164.131.244.',
      '185.24.184.',
      '185.24.184.',
      '185.24.185.',
      '185.24.186.',
      '185.24.186.',
      '185.24.187.',
      '192.134.136.',
      '193.17.19.',
      '194.5.170.',
      '194.5.170.',
      '194.5.171.',
      '194.5.172.',
      '194.5.172.',
      '194.5.173.',
      '195.42.231.',
      '83.118.200.21', // wifi du lab
      '86.234.115.218', // IP de Andrée
    ],
  },
  /**
   * authPasswordFile to BO
   */
  authPasswordFile: process.env.AUTH_PASSWORD_FILE,
  nbInstances: 1,
}
