import { onGetFeedbackStatusApi, onSubmitFeedbackApi } from '../routes/feedback'
import { assert } from 'chai'

module.exports = function (datas) {
  describe('Feedback', () => {
    it('Status - returns hasResponded flag', async () => {
      const response = await onGetFeedbackStatusApi({ userToken: datas.adminToken })

      assert.strictEqual(response.status, 200)
      assert.isBoolean(response.data.data.hasResponded)
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
  })
}
