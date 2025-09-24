import { onRemoveHrApi, onRemoveSituationApi, onUpdateHrApi } from '../routes/hr'
import { assert } from 'chai'
import { normalizeDate } from '../utils/date'

module.exports = function (datas) {
  let hrId = null
  let hrSituationId = []
  let current_hr = null

  describe('Change User data test', () => {
    /**
     * Création d'un nouvel agent
     */
    it('Create new hr', async () => {
      const firstName = 'test'
      const lastName = 'test'
      const matricule = '123456'

      const hr = {
        firstName,
        lastName,
        matricule,
        situations: [],
        dateStart: new Date(),
        indisponibilities: [],
      }

      const response = await onUpdateHrApi({
        userToken: datas.adminToken,
        hr: hr,
        backupId: 11,
      })

      const tmp_firstName = response.data.data.firstName
      const tmp_lastName = response.data.data.lastName
      const tmp_matricule = response.data.data.matricule

      hrId = response.data.data.id
      current_hr = response.data.data
      assert.strictEqual(response.status, 200)
      assert.strictEqual(firstName, tmp_firstName)
      assert.strictEqual(lastName, tmp_lastName)
      assert.strictEqual(matricule, tmp_matricule)
    })

    /**
     * Changement du prénom de l'agent
     */
    it('Change new hr firstname', async () => {
      const firstName = 'firstname'

      const hr = {
        ...current_hr,
        firstName,
      }

      const response = await onUpdateHrApi({
        userToken: datas.adminToken,
        hr: hr,
        backupId: 11,
      })
      current_hr = response.data.data

      const tmp_firstName = response.data.data.firstName

      assert.strictEqual(response.status, 200)
      assert.strictEqual(firstName, tmp_firstName)
    })

    /**
     * Changement du nom de l'agent
     */
    it('Change new hr lastname', async () => {
      const lastName = 'lastname'
      const hr = {
        ...current_hr,
        lastName,
      }
      const response = await onUpdateHrApi({
        userToken: datas.adminToken,
        hr: hr,
        backupId: 11,
      })
      current_hr = response.data.data
      const tmp_lastName = response.data.data.lastName

      assert.strictEqual(response.status, 200)
      assert.strictEqual(lastName, tmp_lastName)
    })


    /**
     * Ajout d'une nouvelle situation pour l'agent
     */
    it('Add new hr situation', async () => {
      const activities = [
        {
          percent: 100,
          contentieux: { id: 447, label: 'Contentieux Social' },
        },
        {
          percent: 100,
          contentieux: { id: 448, label: "Départage prud'homal" },
        },
      ]
      const category = { id: 1, rank: 1, label: 'Magistrat' }
      const dateStart = normalizeDate(new Date())
      const etp = 1
      const fonction = { id: 22, rank: 1, code: 'P', label: 'PRÉSIDENT', category_detail: 'M-TIT', position: 'Titulaire', calculatriceIsActive: false }

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
      const response = await onUpdateHrApi({
        userToken: datas.adminToken,
        hr: hr,
        backupId: hr.backupId,
      })

      const tmp_activities = response.data.data.situations[0].activities.map(activity => { delete activity.id; return activity })
      const tmp_category = response.data.data.situations[0].category
      const tmp_dateStart = normalizeDate(new Date(response.data.data.situations[0].dateStart))
      const tmp_etp = response.data.data.situations[0].etp
      const tmp_fonction = response.data.data.situations[0].fonction

      // Sort both arrays so that we can compare them
      activities.sort((a, b) => a.contentieux.id - b.contentieux.id);
      tmp_activities.sort((a, b) => a.contentieux.id - b.contentieux.id);
      
      hrSituationId.push(response.data.data.situations[0].id)
      current_hr = response.data.data

      assert.strictEqual(response.status, 200)
      assert.deepEqual(activities, tmp_activities)
      assert.deepEqual(category, tmp_category)
      assert.deepEqual(dateStart, tmp_dateStart)
      assert.strictEqual(etp, tmp_etp)
      assert.deepEqual(fonction, tmp_fonction)
    })

    /**
     * Ajout d'une seconde situation pour l'agent
     */
    it('Add a second hr situation', async () => {
      const activities = [
        {
          percent: 100,
          contentieux: { id: 447, label: 'Contentieux Social' },
        },
        {
          percent: 100,
          contentieux: { id: 448, label: "Départage prud'homal" },
        },
        {
          percent: 20,
          contentieux: { id: 460, label: 'Contentieux de la Protection' },
        },
        {
          percent: 20,
          contentieux: { id: 462, label: 'Protection des majeurs' },
        },
      ]
      const category = { id: 1, rank: 1, label: 'Magistrat'  }
      const dateStart = normalizeDate(new Date())
      dateStart.setDate(dateStart.getDate() + 20)
      const etp = 1
      const fonction = { id: 22, rank: 1, code: 'P', label: 'PRÉSIDENT', category_detail: 'M-TIT', position: 'Titulaire', calculatriceIsActive: false }

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
      const response = await onUpdateHrApi({
        userToken: datas.adminToken,
        hr: hr,
        backupId: hr.backupId,
      })
      const tmp_activities = response.data.data.situations[0].activities.map(activity => { delete activity.id; return activity })
      const tmp_category = response.data.data.situations[0].category
      const tmp_dateStart = normalizeDate(new Date(response.data.data.situations[0].dateStart))
      const tmp_etp = response.data.data.situations[0].etp
      const tmp_fonction = response.data.data.situations[0].fonction

      hrSituationId.push(response.data.data.situations[0].id)
      current_hr = response.data.data
      assert.strictEqual(response.status, 200)
      assert.strictEqual(response.data.data.situations.length, 2)
      assert.sameDeepMembers(activities, tmp_activities)
      assert.deepEqual(category, tmp_category)
      assert.deepEqual(dateStart, tmp_dateStart)
      assert.strictEqual(etp, tmp_etp)
      assert.deepEqual(fonction, tmp_fonction)
    })

    /**
     * Ajout d'indisponibilité pour l'agent
     */
    it('Add new hr unavailability ', async () => {
      const contentieux = {
        id: 508,
        label: 'Congé longue maladie',
        checkVentilation: false
      }

      const percent = 100
      const dateStart = normalizeDate(new Date())
      const dateStop = normalizeDate(new Date())
      dateStop.setDate(dateStop.getDate() + 20)


      const indisponibilities = [
        {
          contentieux,
          percent,
          dateStart,
          dateStop,
        },
      ]

      const hr = {
        ...current_hr,
        indisponibilities: indisponibilities,
      }

      const response = await onUpdateHrApi({
        userToken: datas.adminToken,
        hr: hr,
        backupId: hr.backupId,
      })

      current_hr = response.data.data

      const tmp_dateStart = normalizeDate(new Date(response.data.data.indisponibilities[0].dateStart))
      const tmp_dateStop = normalizeDate(new Date(response.data.data.indisponibilities[0].dateStop))
      const tmp_contentieux = response.data.data.indisponibilities[0].contentieux
      const tmp_percent = response.data.data.indisponibilities[0].percent

      assert.strictEqual(response.status, 200);
      assert.deepEqual(dateStart, tmp_dateStart);
      assert.deepEqual(dateStop, tmp_dateStop);
      assert.deepEqual(contentieux, tmp_contentieux);
      assert.strictEqual(percent, tmp_percent);
    })

    /**
     * Correction d'une situation pour l'agent - Changement de la fonction de l'agent
     */
    it("Correct a situation - Change agent's Fonction only", async () => {
      const oldSituation = current_hr.situations

      const correctedSituation = [
        oldSituation[0],
        {
          ...oldSituation[1],
          fonction: {
            id: 1,
            rank: 2,
            code: '1VP',
            label: 'PREMIER VICE-PRÉSIDENT',
            category_detail: 'M-TIT',
            position: 'Titulaire',
            calculatriceIsActive: false,
          },
        },
      ]

      const hr = {
        ...current_hr,
        situations: correctedSituation,
      }
      const response = await onUpdateHrApi({
        userToken: datas.adminToken,
        hr: hr,
        backupId: hr.backupId,
      })

      const newSituation = response.data.data.situations
      current_hr = response.data.data
      assert.strictEqual(response.status, 200)
      assert.notDeepEqual(oldSituation[1].fonction, newSituation[1].fonction)
      assert.deepEqual(correctedSituation[1].fonction, newSituation[1].fonction)
    })

    /**
     * Correction d'une situation pour l'agent - Changement de la catégorie et de la fonction de l'agent
     */
    it("Correct a situation - Change agent's Category and Fonction", async () => {
      const oldSituation = current_hr.situations
      const hr = {
        ...current_hr,
        situations: [
          {
            ...oldSituation[0],
            category: { id: 2, rank: 2, label: 'Greffe' },
            fonction: {
              id: 44,
              rank: 3,
              code: 'B',
              label: 'B GREFFIER',
              category_detail: 'F-TIT',
              position: 'Titulaire',
              calculatriceIsActive: false,
            },
          },
          oldSituation[1],
        ],
      }
      const response = await onUpdateHrApi({
        userToken: datas.adminToken,
        hr: hr,
        backupId: hr.backupId,
      })

      const newSituation = response.data.data.situations
      current_hr = response.data.data

      assert.strictEqual(response.status, 200)
      assert.notDeepEqual(oldSituation[0].category, newSituation[0].category)
      assert.notDeepEqual(oldSituation[0].fonction, newSituation[0].fonction)
      assert.deepEqual(hr.situations[0].category, newSituation[0].category)
      assert.deepEqual(hr.situations[0].fonction, newSituation[0].fonction)
    })

    /**
     * Correction d'une situation pour l'agent - Changement de l'ETP
    */
    it('Correct a situation - Change one situation etp', async () => {
      const oldSituation = current_hr.situations
      const newEtp = 0.7
      const hr = {
        ...current_hr,
        situations: [
          {
            ...oldSituation[0],
            etp: newEtp,
          },
          oldSituation[1],
        ],
      }
      const response = await onUpdateHrApi({
        userToken: datas.adminToken,
        hr: hr,
        backupId: hr.backupId,
      })
      const newSituation = response.data.data.situations
      current_hr = response.data.data
      assert.strictEqual(response.status, 200)
      assert.notStrictEqual(oldSituation[0].etp, newSituation[0].etp)
      assert.strictEqual(newEtp, newSituation[0].etp)
    })

    /**
     * Ajout d'une date de départ à l'agent
     */
    it('Add an End Date to newly created agent', async () => {
      let dateEnd = new Date(current_hr.dateStart)
      dateEnd.setDate(dateEnd.getDate() + 20)

      const hr = {
        ...current_hr,
        dateEnd,
      }

      const response = await onUpdateHrApi({
        userToken: datas.adminToken,
        hr: hr,
        backupId: hr.backupId,
      })
      const responseDateEnd = new Date(response.data.data.dateEnd)

      current_hr = response.data.data
      assert.strictEqual(response.status, 200)
      assert.deepEqual(responseDateEnd, dateEnd)
    })

    /**
     * Suppression d'une situation pour l'agent'
     */
    it('Remove created situation', async () => {
      // ⚠️ This route must not be used in production ! The equivalent route for production is '/human-resources/remove-situation/:situationId'
      let response = null
      for (let id of hrSituationId) {
        response = await onRemoveSituationApi({
          userToken: datas.adminToken,
          id: id,
        })
      }
      assert.strictEqual(response.status, 200)
      assert.isEmpty(response.data.data.situations)
    })

    /**
     * Suppression de l'agent
     */
    it('Remove created hr', async () => {
      // ⚠️ This route must not be used in production ! The equivalent route for production is '/human-resources/remove-hr/:hrId'
      const response = await onRemoveHrApi({
        userToken: datas.adminToken,
        hrId: hrId,
      })
      assert.strictEqual(response.status, 200)
    })
  })
}
