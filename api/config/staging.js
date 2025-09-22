module.exports = {
  envName: 'STAGING',
  displayEnvName: '[STAGING] ',
  serverUrl: process.env.SERVER_URL,
  frontUrl: process.env.FRONT_URL || 'http://localhost:4200',
  preloadHumanResourcesDatas: true,
  nbMaxDayCanBeInactive: null,
  redis: process.env.REDIS_URL,
  sendingBlue: {
    usersListId: 7,
  },
  forceSSL: true,
  formatLogs: true,
  login: {
    shareAuthCode: false,
    enable2Auth: true,
    max2AuthByMonth: 1,
  },
  nbInstances: 3,
}
