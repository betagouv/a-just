import axios from 'axios'
import config from 'config'
import { assert } from 'chai'

module.exports = function () {
  describe('Test Route Index', () => {
    it('has 200 response code', async () => {
      const response = await axios.get(config.serverUrl)
      assert.equal(response.status, 200, 'the response code is not 200')
    })
  })
}
