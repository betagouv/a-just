import axios from 'axios'
import config from 'config'
import { assert } from 'chai'

module.exports = function () {
  let userToken = null
  let HR = []
  let backupId = null

  describe('Générate user auth', () => {
    it('has token response code', async () => {
      const response = await axios.post(`${config.serverUrl}/auths/login`, {
        email: 'fx@a-just.fr',
        password: '123456',
      })
      userToken = response.data && response.data.token
      assert.isOk(userToken, 'cannot generate token')
    })
  })

  describe('Test HR', () => {
    it('load HR', async () => {
      const response = await axios.post(
        `${config.serverUrl}/human-resources/get-current-hr`,
        {
          backupId: null,
        },
        {
          headers: {
            Authorization: userToken,
          },
        }
      )

      HR = response.data && response.data.data && response.data.data.hr
      backupId = response.data && response.data.data && response.data.data.backupId
      assert.isOk(HR.length === 17, 'missing hr when imported')
    })

    it('edit HR', async () => {
      const response = await axios.post(
        `${config.serverUrl}/human-resources/save-backup`,
        {
          hrList: HR.slice(0, 10),
          backupId,
          backupName: 'test copy',
        },
        {
          headers: {
            Authorization: userToken,
          },
        }
      )
      assert.equal(response.status, 200, 'save HR fail')

      HR = response.data && response.data.data && response.data.data.hr
      backupId = response.data && response.data.data && response.data.data.backupId
      assert.isOk(HR.length === 17, 'missing hr when imported')
    })

    it('load Copy', async () => {
      const response = await axios.post(
        `${config.serverUrl}/human-resources/get-current-hr`,
        {
          backupId: null,
        },
        {
          headers: {
            Authorization: userToken,
          },
        }
      )

      HR = response.data && response.data.data && response.data.data.hr
      backupId = response.data && response.data.data && response.data.data.backupId
      assert.isOk(HR.length === 10, 'missing hr when save')
    })

    it('delete Copy', async () => {
      const response = await axios.delete(
        `${config.serverUrl}/human-resources/remove-backup/${backupId}`,
        {
          headers: {
            Authorization: userToken,
          },
        }
      )

      assert.equal(response.status, 200, 'delete backup fail')
    })
  })

}
