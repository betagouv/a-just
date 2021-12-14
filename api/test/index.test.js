let axios = require('axios')
let config = require('config')
let assert = require('chai').assert
let server = require('../dist/index').default

describe('Test server is ready', () => {
  before((done) => {
    server.isReady = function () {
      done()
    }
  })

  it('has 200 response code', () => {
    axios.get(config.serverUrl)
      .then((response) => {
        assert.equal(response.status, 200, 'the response code is not 200')
      })    
  })

  after(function () {
    server.done()
  })
})
