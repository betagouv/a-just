module.exports = {
  envName: 'STAGING',
  displayEnvName: '[STAGING] ',
  serverUrl: process.env.SERVER_URL,
  frontUrl: process.env.FRONT_URL || 'http://localhost:4200',
  preloadHumanResourcesDatas: true,
  nbMaxMonthCanBeInactive: null,
  sendingBlue: {
    usersListId: 7,
  },
}
