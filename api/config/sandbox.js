module.exports = {
  envName: 'SANDBOX',
  displayEnvName: '[SANDBOX] ',
  serverUrl: process.env.SERVER_URL,
  frontUrl: process.env.FRONT_URL || 'http://localhost:4200',
  preloadHumanResourcesDatas: true,
  nbMaxDayCanBeInactive: null,
  sendingBlue: {
    usersListId: 9,
  },
  forceSSL: true,
  formatLogs: true,
  login: {
    shareAuthCode: true,
    enable2Auth: true,
    max2AuthByMonth: 1,
  },
  /**
   * Url du cors
   */
  corsUrl: [
    process.env.FRONT_URL,
    process.env.SERVER_URL,
    'http://localhost:4200',
    'http://localhost:' + (process.env.PORT || 8081),
    'aide.a-just-ca.beta.gouv.fr',
    'aide.a-just.incubateur.net',
    'aide.a-just-ca.incubateur.net',
    'aide.a-just.beta.gouv.fr',
  ],
}
