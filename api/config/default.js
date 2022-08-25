require('dotenv').config()

module.exports = {
  envName: '',
  serverUrl: process.env.SERVER_URL || 'http://localhost:8080/api',
  frontUrl: process.env.FRONT_URL || 'http://localhost:4200',
  port: process.env.PORT || 8080,
  database: {
    url: process.env.DATABASE_URL,
    // logging: false,
  },
  jsonwebtoken: {
    private_key: process.env.JSON_WEB_TOKEN,
  },
  consoleLog: true,
  sendinblue: process.env.SENDINBLUE,
  logsPassword: process.env.LOGS_PASSWORD,
  contactEmail: process.env.CONTACT_EMAIL,
  preloadHumanResourcesDatas: false,
  nbDaysByMagistrat: 208,
  nbHoursPerDay: 8,
}
