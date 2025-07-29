import axios from 'axios'
import config from 'config'
import { USER_ADMIN_EMAIL, USER_ADMIN_PASSWORD } from '../constants/admin'

module.exports = function () {
  let userToken = null
  let options = []
  let backupId = null
  let referentiels = []

  describe('Générate user auth', () => {
    it('has token response code', async () => {
      const response = await axios.post(`${config.serverUrl}/auths/login`, {
        email: USER_ADMIN_EMAIL,
        password: USER_ADMIN_PASSWORD,
      })
      userToken = response.data && response.data.token
      assert.isOk(userToken, 'cannot generate token')
    })
  })

  describe('Test Contentieux Options', () => {
    it('load Referentiel', async () => {
      const response = await axios.post(`${config.serverUrl}/referentiels/get-referentiels`, {
        headers: {
          Authorization: userToken,
        },
      })

      referentiels = response.data && response.data.data
      assert.isOk(referentiels.length !== 0, 'missing referentiel')
    })

    it('load Contentieux Options', async () => {
      const response = await axios.post(
        `${config.serverUrl}/contentieux-options/get-all`,
        {
          backupId: null,
        },
        {
          headers: {
            Authorization: userToken,
          },
        }
      )

      options = response.data && response.data.data && response.data.data.list
      backupId = response.data && response.data.data && response.data.data.backupId
      assert.isOk(options.length === 0, 'options whas imported')
    })

    it('add Options', async () => {
      const response = await axios.post(
        `${config.serverUrl}/contentieux-options/save-backup`,
        {
          list: [
            {
              averageProcessingTime: 8,
              contentieux: referentiels[0],
            },
          ],
          backupId,
          backupName: 'test copy',
        },
        {
          headers: {
            Authorization: userToken,
          },
        }
      )
      assert.equal(response.status, 200, 'save Options fail')
      backupId = response.data && response.data.data
    })

    it('load current options', async () => {
      const response = await axios.post(
        `${config.serverUrl}/contentieux-options/get-all`,
        {
          backupId,
        },
        {
          headers: {
            Authorization: userToken,
          },
        }
      )

      options = response.data && response.data.data && response.data.data.list
      backupId = response.data && response.data.data && response.data.data.backupId
      assert.isOk(options.length === 1, 'options not loaded')
    })

    it('delete Copy', async () => {
      const response = await axios.delete(`${config.serverUrl}/contentieux-options/remove-backup/${backupId}`, {
        headers: {
          Authorization: userToken,
        },
      })

      assert.equal(response.status, 200, 'delete backup fail')
    })
  })
}
