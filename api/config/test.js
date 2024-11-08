module.exports = {
  envName: '[TEST] ',
  preLoad: false,
  login: {
    shareAuthCode: true,
    enable2Auth: false,
    max2AuthByMonth: 1,
  },
  /**
   * Path de la base
   */
  database: {
    url: process.env.DATABASE_URL,
    logging: false,
  },
  sentEmail: false,
}
