module.exports = {
  envName: 'STAGING',
  displayEnvName: '[STAGING] ',
  serverUrl: process.env.SERVER_URL,
  frontUrl: process.env.FRONT_URL || 'http://localhost:4200',
  preloadHumanResourcesDatas: true,
  nbMaxDayCanBeInactive: null,
  sendingBlue: {
    usersListId: 7,
  },
}
