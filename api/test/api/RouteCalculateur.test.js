import config from 'config'
import axios from 'axios'
import { assert } from 'chai'
import { accessList } from '../../src/constants/access'

module.exports = function () {
  let data = null
  let backups = null
  let adminToken = null
  let userToken = null
  let userId = null
  let lastMonth = null

  describe('Check calcul ', () => {
    it('Login - Login admin', async () => {
      const email = 'redwane.zafari@a-just.fr'
      const password = '123456'

      // Connexion de l'admin
      const response = await axios.post(`${config.serverUrl}/auths/login`, {
        email,
        password,
      })
      // Récupération du token associé pour l'identifier
      adminToken = response.data.token
      assert.strictEqual(response.status, 201)
    })

    it('Sign up - Create test user', async () => {
      const response = await axios.post(`${config.serverUrl}/users/create-account`, {
        email: 'test@mail.com',
        password: '123456',
        firstName: 'userTest',
        lastName: 'userTest',
        fonction: 'Vacataire',
        tj: 'ESSAI',
      })
      assert.strictEqual(response.status, 200)
    })

    it('Login - Log user', async () => {
      const email = 'test@mail.com'
      const password = '123456'

      const response = await axios.post(`${config.serverUrl}/auths/login`, {
        email,
        password,
      })
      userToken = response.status === 201 && response.data.token
      userId = response.data.user.id

      assert.isOk(userToken, 'response 201 and user token created')
    })

    it('Give user accesses and add user to a tj by Admin', async () => {
      let response = await axios.get(`${config.serverUrl}/human-resources/get-backup-list`, {
        headers: {
          authorization: adminToken,
        },
      })
      backups = response.data.data
      const accessIds = accessList.map((elem) => {
        return elem.id
      })
      response = await axios.post(
        `${config.serverUrl}/users/update-account`,
        {
          userId: userId,
          access: accessIds,
          ventilations: [backups[0].id],
        },
        {
          headers: {
            authorization: adminToken,
          },
        }
      )
      assert.strictEqual(response.status, 200)
    })

    it('Get my datas as a connected user. Should return 200', async () => {
      const response = await axios.get(`${config.serverUrl}/users/get-user-datas`, {
        headers: {
          authorization: userToken,
        },
      })
      assert.strictEqual(response.status, 200)
    })

    it('Get last month', async () => {
      //get last month data for specific jurisdiction
      let response = await axios.post(
        `${config.serverUrl}/activities/get-last-month`,
        {
          hrBackupId: backups[0].id,
        },
        {
          headers: {
            authorization: adminToken,
          },
        }
      )
      lastMonth = response.data.date
      assert.strictEqual(response.status, 200)
    })

    it('Catch data', async () => {
      const dateStop = new Date(lastMonth)
      const dateStart = new Date(new Date(dateStop).setDate(dateStop.getDate() - 30))
      const categorySelected = 'magistrats'
      const contentieuxIds = [447, 440, 460, 451, 467, 471, 486, 475, 480, 485, 497]

      const response = await axios.post(
        `${config.serverUrl}/calculator/filter-list`,
        {
          backupId: backups[0].id,
          dateStart,
          dateStop,
          contentieuxIds,
          optionBackupId: null,
          categorySelected,
          selectedFonctionsIds: null,
        },
        {
          headers: {
            authorization: userToken,
          },
        }
      )
      console.log('Reponse catch data:', response.data.data.list[0].childrens[0])
    })

    it('Remove user Account by admin', async () => {
      // ⚠️ This route must not be use in code production ! The equivalent route for production is '/users/remove-account/:id'
      const response = await axios.delete(`${config.serverUrl}/users/remove-account-test/${userId}`, {
        headers: {
          authorization: adminToken,
        },
      })

      assert.strictEqual(response.status, 200)
    })
  })
}
