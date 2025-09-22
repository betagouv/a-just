module.exports = {
  envName: 'PROD',
  displayEnvName: '',
  serverUrl: process.env.SERVER_URL,
  frontUrl: process.env.FRONT_URL || 'http://localhost:4200',
  preloadHumanResourcesDatas: true,
  redis: process.env.REDIS_URL,
  sendingBlue: {
    usersListId: 8,
  },
  forceSSL: true,
  formatLogs: true,
  login: {
    shareAuthCode: false,
    enable2Auth: true,
    max2AuthByMonth: 1,
  },
}
