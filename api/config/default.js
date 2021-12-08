require('dotenv').config()

module.exports = {
  envName: '',
  port: process.env.PORT || 8080,
  database: {
    url: process.env.DATABASE_URL,
  },
  jsonwebtoken: {
    private_key: process.env.JSON_WEB_TOKEN,
  },
  juridictionId: 1,
}
