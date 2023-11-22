require('dotenv').config()

module.exports = {
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
  corsUrl: process.env.FRONT_URL || 'http://localhost:4200',
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
   * Affiche ou non les consoles
   */
  consoleLog: true,
  /**
   * Clé API de sendinblue
   */
  sendinblue: process.env.SENDINBLUE,
  /**
   * Mot de passe de connexion à la partie LOGS
   */
  logsPassword: process.env.LOGS_PASSWORD,
  /**
   * Email de l'administrateur
   */
  contactEmail: process.env.CONTACT_EMAIL,
  /**
   * Email du support
   */
  supportEmail: process.env.SUPPORT_EMAIL,
  /**
   * Préchargement de toutes les jurictions ? (Prend 30s et de la mémoire)
   */
  preloadHumanResourcesDatas: false,
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
  nbMaxDayTokenLife: 7,
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
}
