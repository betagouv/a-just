import { OnTestRoute } from '../routes/testRoute'
import { assert } from 'chai'

module.exports = function () {
  describe('Test Route Index', () => {
    it('has 200 response code', async () => {
      const response = await OnTestRoute()
      assert.equal(response.status, 200, 'the response code is not 200')
    })
  })
}
