import axios from 'axios'
import config from 'config'
import { assert } from 'chai'

module.exports = function () {
  let userToken = null
  let activities = []
  let backupId = null
  let referentiels = []

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

  describe('Test Activities', () => {
    it('load Referentiel', async () => {
      const response = await axios.get(
        `${config.serverUrl}/referentiels/get-referentiels`,
        {
          headers: {
            Authorization: userToken,
          },
        }
      )

      referentiels = response.data && response.data.data
      assert.isOk(referentiels.length !== 0, 'missing referentiel')
    })

    it('load Activities', async () => {
      const response = await axios.post(
        `${config.serverUrl}/activities/get-all`,
        {
          backupId: null,
        },
        {
          headers: {
            Authorization: userToken,
          },
        }
      )

      activities = response.data && response.data.data && response.data.data.activities
      backupId = response.data && response.data.data && response.data.data.backupId
      assert.isOk(activities.length === 0, 'activities whas imported')
    })

    it('add Acitivity', async () => {
      const response = await axios.post(
        `${config.serverUrl}/activities/save-backup`,
        {
          list: [{
            periode: new Date(),
            entrees: 10,
            sorties: 20,
            stock: 30,
            contentieux: referentiels[0],
          }],
          backupId,
          backupName: 'test copy',
        },
        {
          headers: {
            Authorization: userToken,
          },
        }
      )
      assert.equal(response.status, 200, 'save Activities fail')
      backupId = response.data && response.data.data
    })

    it('load current activities', async () => {
      const response = await axios.post(
        `${config.serverUrl}/activities/get-all`,
        {
          backupId,
        },
        {
          headers: {
            Authorization: userToken,
          },
        }
      )

      activities = response.data && response.data.data && response.data.data.activities
      backupId = response.data && response.data.data && response.data.data.backupId
      assert.isOk(activities.length === 1, 'activities not loaded')
    })

    it('delete Copy', async () => {
      const response = await axios.delete(
        `${config.serverUrl}/activities/remove-backup/${backupId}`,
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
