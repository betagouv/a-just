require('dotenv').config()

module.exports = {
  envName: '',
  port: process.env.PORT || 8080,
  database: {
    url: process.env.DATABASE_URL,
  },
}
