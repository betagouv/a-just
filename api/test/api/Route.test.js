let axios = require('axios')
let assert = require('chai').assert
let server = require('../../dist/index')

describe('Test import datas', () => {
  before((done) => {
    server.isReady = function () {
      console.log('test')
      done()
    }
  })

  it('has 200 response code', () => {
    axios.get(process.env.SERVER_URL || 'http://localhost:8080/api')
      .then((response) => {
        console.log(response)
        assert.equal(response.status, 200, 'the response code is not 200')
      })    
  })
})
