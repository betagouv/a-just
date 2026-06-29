import {
  onGetFeedbackAllApi,
  onGetFeedbackStatsApi,
  onGetFeedbackStatusApi,
  onSubmitFeedbackApi,
} from '../routes/feedback'
import { assert } from 'chai'

module.exports = function (datas) {
  describe('Feedback', () => {
    it('Status - returns hasResponded flag', async () => {
      const response = await onGetFeedbackStatusApi({ userToken: datas.adminToken })

      assert.strictEqual(response.status, 200)
      assert.isBoolean(response.data.data.hasResponded)
      assert.isBoolean(response.data.data.eligibleForFeedback)
    })

    it('Submit - missing rating should return 400', async () => {
      const response = await onSubmitFeedbackApi({
        userToken: datas.adminToken,
        comment: 'Test sans note',
      })

      assert.strictEqual(response.status, 400)
    })

    it('Submit - valid rating saves feedback', async () => {
      const response = await onSubmitFeedbackApi({
        userToken: datas.adminToken,
        rating: 4,
        comment: 'Très bon outil',
        page: '/panorama',
      })

      assert.strictEqual(response.status, 200)
    })

    it('Status - hasResponded is true after submit', async () => {
      const response = await onGetFeedbackStatusApi({ userToken: datas.adminToken })

      assert.strictEqual(response.status, 200)
      assert.strictEqual(response.data.data.hasResponded, true)
    })

    it('Submit - duplicate submit is idempotent', async () => {
      const response = await onSubmitFeedbackApi({
        userToken: datas.adminToken,
        rating: 5,
        comment: 'Second submit',
      })

      assert.strictEqual(response.status, 200)
    })

    it('GetAll - returns feedback list for admin', async () => {
      const response = await onGetFeedbackAllApi({ userToken: datas.adminToken })

      assert.strictEqual(response.status, 200)
      assert.isArray(response.data.data)
      assert.isAtLeast(response.data.data.length, 1)
      assert.property(response.data.data[0], 'rating')
      assert.property(response.data.data[0], 'user')
    })

    it('Stats - returns aggregates for admin', async () => {
      const response = await onGetFeedbackStatsApi({ userToken: datas.adminToken })

      assert.strictEqual(response.status, 200)
      assert.isAtLeast(response.data.data.total, 1)
      assert.property(response.data.data, 'byRating')
      assert.property(response.data.data, 'byMonth')
      assert.property(response.data.data, 'topPages')
    })
  })
}
