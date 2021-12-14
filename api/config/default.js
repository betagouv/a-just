require('dotenv').config()

module.exports = {
  envName: '',
  serverUrl: process.env.SERVER_URL || 'http://localhost:8080/api',
  port: process.env.PORT || 8080,
  database: {
    url: process.env.DATABASE_URL,
  },
  jsonwebtoken: {
    private_key: process.env.JSON_WEB_TOKEN,
  },
  juridictionId: 1,
}
