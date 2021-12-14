let axios = require('axios')
let assert = require('chai').assert
let server = require('../dist/index').default

describe('Test server is ready', () => {
  before((done) => {
    server.isReady = function () {
      done()
    }
  })

  it('has 200 response code', () => {
    axios.get(process.env.SERVER_URL || 'http://localhost:8080/api')
      .then((response) => {
        assert.equal(response.status, 200, 'the response code is not 200')
      })    
  })

  after(function () {
    console.log('done?')
    server.done()
  })
})
