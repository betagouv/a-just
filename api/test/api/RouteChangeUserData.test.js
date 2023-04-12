import axios from 'axios'
import config from 'config'
import { assert } from 'chai'
import { accessList } from '../../src/constants/access'

module.exports = function () {
  let adminToken = null
  let userToken = null
  let userId = null
  let hrId = null
  let hrSituationId = []
  let current_hr = null

  describe('Change User data test', () => {
    /*it('Login - Login admin', async () => {
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
        email: userEmail,
        password: userPassword,
        firstName: userFirstname,
        lastName: userlastname,
        fonction: 'Vacataire',
        tj: 'ESSAI',
      })
      assert.strictEqual(response.status, 200)
    })*/

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

    it('Give user accesses by Admin', async () => {
      const accessIds = accessList.map((elem) => {
        return elem.id
      })
      const response = await axios.post(
        `${config.serverUrl}/users/update-account`,
        {
          userId: userId,
          access: accessIds,
          ventilations: [], //{ id: 11, label: 'ESSAI' },
        },
        {
          headers: {
            authorization: adminToken,
          },
        }
      )
      assert.strictEqual(response.status, 200)
    })

    it('Create new hr', async () => {
      const hr = {
        firstName: 'test',
        lastName: 'test',
        matricule: '123456',
        situations: [],
        dateStart: new Date(),
        indisponibilities: [],
      }
      const response = await axios.post(
        `${config.serverUrl}/human-resources/update-hr`,
        {
          hr,
          backupId: 11,
        },
        {
          headers: {
            authorization: adminToken,
          },
        }
      )
      hrId = response.data.data.id
      current_hr = response.data.data
      assert.strictEqual(response.status, 200)
    })

    it('Change new hr firstname', async () => {
      const hr = {
        ...current_hr,
        firstName: 'firstname',
      }
      const response = await axios.post(
        `${config.serverUrl}/human-resources/update-hr`,
        {
          hr,
          backupId: 11,
        },
        {
          headers: {
            authorization: adminToken,
          },
        }
      )
      current_hr = response.data.data
      assert.strictEqual(response.status, 200)
    })

    it('Change new hr lastname', async () => {
      const hr = {
        ...current_hr,
        lastName: 'lastname',
      }
      const response = await axios.post(
        `${config.serverUrl}/human-resources/update-hr`,
        {
          hr,
          backupId: 11,
        },
        {
          headers: {
            authorization: adminToken,
          },
        }
      )
      current_hr = response.data.data
      assert.strictEqual(response.status, 200)
    })

    it('Add new hr situation', async () => {
      const activities = [
        {
          percent: 100,
          contentieux: { id: 447, label: 'Contentieux Social', percent: 100 },
        },
        {
          percent: 100,
          contentieux: { id: 448, label: 'Contentieux du travail', percent: 100 },
        },
      ]
      const category = { id: 1, label: 'Magistrat', rank: 1 }
      const dateStart = new Date()
      const etp = 1
      const fonction = { id: 0, rank: 1, code: 'P', label: 'PRÉSIDENT' }

      const situatiuons = [
        {
          activities,
          category,
          dateStart,
          etp,
          fonction,
        },
      ]

      const hr = {
        ...current_hr,
        situations: situatiuons,
      }
      const response = await axios.post(
        `${config.serverUrl}/human-resources/update-hr`,
        {
          hr,
          backupId: hr.backupId,
        },
        {
          headers: {
            authorization: adminToken,
          },
        }
      )

      hrSituationId.push(response.data.data.situations[0].id)
      current_hr = response.data.data
      assert.strictEqual(response.status, 200)
    })

    it('Add a second hr situation', async () => {
      const activities = [
        {
          percent: 100,
          contentieux: { id: 447, label: 'Contentieux Social', percent: 100 },
        },
        {
          percent: 100,
          contentieux: { id: 448, label: 'Contentieux du travail', percent: 100 },
        },
        {
          percent: 20,
          contentieux: { id: 460, label: 'Contentieux de la Protection', percent: 20 },
        },
        {
          percent: 20,
          contentieux: { id: 462, label: 'Protection des majeurs', percent: 20 },
        },
      ]
      const category = { id: 1, label: 'Magistrat', rank: 1 }
      const now = new Date()
      const dateStart = now.setDate(now.getDate() + 20)
      const etp = 1
      const fonction = { id: 0, rank: 1, code: 'P', label: 'PRÉSIDENT', category_detail: 'M-TIT' }

      const situatiuons = [
        current_hr.situations[0],
        {
          activities,
          category,
          dateStart,
          etp,
          fonction,
        },
      ]

      const hr = {
        ...current_hr,
        situations: situatiuons,
      }
      const response = await axios.post(
        `${config.serverUrl}/human-resources/update-hr`,
        {
          hr,
          backupId: hr.backupId,
        },
        {
          headers: {
            authorization: adminToken,
          },
        }
      )

      hrSituationId.push(response.data.data.situations[0].id)
      current_hr = response.data.data
      assert.strictEqual(response.status, 200)
      assert.strictEqual(response.data.data.situations.length, 2)
    })

    it('Add new hr unavailability ', async () => {
      const contentieux = {
        code_import: '12.3.',
        id: 508,
        label: 'Congé longue maladie',
        rank: 87,
      }

      const now = new Date()
      const dateStop = now.getDate() + 20

      const indisponibilities = [
        {
          contentieux,
          percent: 100,
          dateStart: new Date(),
          dateStop,
        },
      ]

      const hr = {
        ...current_hr,
        indisponibilities: indisponibilities,
      }

      const response = await axios.post(
        `${config.serverUrl}/human-resources/update-hr`,
        {
          hr,
          backupId: hr.backupId,
        },
        {
          headers: {
            authorization: adminToken,
          },
        }
      )
      current_hr = response.data.data
      assert.strictEqual(response.status, 200)
    })

    it('Correct a situation - Change agent Fonction only', async () => {
      const oldSituation = current_hr.situations

      const correctedSituation = [
        oldSituation[0],
        {
          ...oldSituation[1],
          fonction: { id: 1, rank: 2, code: '1VP', label: 'PREMIER VICE-PRÉSIDENT', category_detail: 'M-TIT' },
        },
      ]

      const hr = {
        ...current_hr,
        situations: correctedSituation,
      }
      const response = await axios.post(
        `${config.serverUrl}/human-resources/update-hr`,
        {
          hr,
          backupId: hr.backupId,
        },
        {
          headers: {
            authorization: adminToken,
          },
        }
      )
      const newSituation = response.data.data.situations

      current_hr = response.data.data
      assert.strictEqual(response.status, 200)
      assert.notDeepEqual(oldSituation[1].fonction, newSituation[1].fonction)
      assert.deepEqual(correctedSituation[1].fonction, newSituation[1].fonction)
    })

    it('Correct a situation - Change agent Category and Fonction', async () => {
      const oldSituation = current_hr.situations

      const hr = {
        ...current_hr,
        situations: [
          {
            ...oldSituation[0],
            category: { id: 2, rank: 2, label: 'Fonctionnaire' },
            fonction: { id: 43, rank: 1, code: 'B greffier', label: 'B greffier', category_detail: 'F-TIT' },
          },
          oldSituation[1],
        ],
      }
      const response = await axios.post(
        `${config.serverUrl}/human-resources/update-hr`,
        {
          hr,
          backupId: hr.backupId,
        },
        {
          headers: {
            authorization: adminToken,
          },
        }
      )
      const newSituation = response.data.data.situations[0]

      current_hr = response.data.data
      assert.strictEqual(response.status, 200)
      assert.notDeepEqual(oldSituation.category, newSituation.category)
      assert.notDeepEqual(oldSituation.fonction, newSituation.fonction)
      assert.deepEqual(hr.situations[0].category, newSituation.category)
      assert.deepEqual(hr.situations[0].fonction, newSituation.fonction)
    })

    it('Correct a situation - Change one situation etp', async () => {
      const oldSituation = current_hr.situations

      const hr = {
        ...current_hr,
        situations: [
          {
            ...oldSituation[0],
            etp: 0.7,
          },
          oldSituation[1],
        ],
      }
      const response = await axios.post(
        `${config.serverUrl}/human-resources/update-hr`,
        {
          hr,
          backupId: hr.backupId,
        },
        {
          headers: {
            authorization: adminToken,
          },
        }
      )
      const newSituation = response.data.data.situations[0]

      current_hr = response.data.data
      assert.strictEqual(response.status, 200)
      assert.notStrictEqual(oldSituation.etp, newSituation.etp)
      assert.strictEqual(0.7, newSituation.etp)
    })

    it('Add an End Date to newly created agent', async () => {
      let dateEnd = new Date(current_hr.dateStart)
      dateEnd.setDate(dateEnd.getDate() + 20)

      const hr = {
        ...current_hr,
        dateEnd,
      }

      const response = await axios.post(
        `${config.serverUrl}/human-resources/update-hr`,
        {
          hr,
          backupId: hr.backupId,
        },
        {
          headers: {
            authorization: adminToken,
          },
        }
      )
      current_hr = response.data.data
      assert.strictEqual(response.status, 200)
      assert.strictEqual(new Date(response.data.data.dateEnd).getTime(), dateEnd.getTime())
    })

    it('Remove created situation', async () => {
      // ⚠️ This route must not be use in code production ! The equivalent route for production is '/human-resources/remove-situation/:situationId'

      let response = null
      for (let id of hrSituationId) {
        response = await axios.delete(`${config.serverUrl}/human-resources/remove-situation-test/${id}`, {
          headers: {
            authorization: adminToken,
          },
        })
      }
      assert.isEmpty(response.data.data.situations)
    })

    it('Remove created hr', async () => {
      // ⚠️ This route must not be use in code production ! The equivalent route for production is '/human-resources/remove-hr/:hrId'
      const response = await axios.delete(`${config.serverUrl}/human-resources/remove-hr-test/${hrId}`, {
        headers: {
          authorization: adminToken,
        },
      })

      assert.strictEqual(response.status, 200)
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
