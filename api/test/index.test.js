import axios from 'axios'
import config from 'config'
import { assert } from 'chai'
import { default as server } from '../dist/index'

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
