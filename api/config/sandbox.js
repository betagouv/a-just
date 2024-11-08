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
}
