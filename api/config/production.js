module.exports = {
  envName: 'PROD',
  serverUrl: process.env.SERVER_URL,
  frontUrl: process.env.FRONT_URL || 'http://localhost:4200',
  preloadHumanResourcesDatas: true,
  sendingBlue: {
    usersListId: 8,
  },
}
