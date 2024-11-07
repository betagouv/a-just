module.exports = {
  envName: 'PREPROD',
  displayEnvName: '',
  serverUrl: process.env.SERVER_URL,
  frontUrl: process.env.FRONT_URL || 'http://localhost:4200',
  preloadHumanResourcesDatas: true,
  sendingBlue: {
    usersListId: 30,
  },
  forceSSL: true,
  formatLogs: true,
  sentEmail: false,
  login: {
    shareAuthCode: false,
    enable2Auth: true,
    max2AuthByMonth: 1,
  },
}
