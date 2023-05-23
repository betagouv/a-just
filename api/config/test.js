module.exports = {
  envName: '[TEST] ',
  preLoad: false,
  /**
   * Path de la base
   */
  database: {
    url: process.env.DATABASE_URL,
    logging: false,
  },
  sentEmail: false,
}
