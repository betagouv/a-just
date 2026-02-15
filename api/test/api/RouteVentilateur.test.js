import { onUpdateAccountApi } from '../routes/user'
import { onFilterListHRApi } from '../routes/hr'
// No longer need JURIDICTION_BACKUP_ID - using datas.adminBackupId instead
import { EAM_ID, GREFFIER_ID, MAGISTART_ID } from '../constants/hrCategories'
import { assert } from 'chai'

module.exports = function (datas) {


  describe('Check calcul -- Ventilateur ', () => {

    /**
     * Vérification que les référentiels (contentieux) proposés dans le filtre sont tous de niveau 1
     */
    it('Check referentiels are all level 1', async () => {
      let referentiel = []
      const response = await onFilterListHRApi({
        userToken: datas.adminToken,
        backupId: datas.adminBackupId,
        date: new Date(),
        categoriesIds: [MAGISTART_ID, GREFFIER_ID, EAM_ID],
      })
      const list = response.data.data.list

      for (let i = 0; i < list.length; i++) {
        list[i].referentiel.map((elem) => {
          if (!referentiel.includes(elem.code_import))
            referentiel.push(elem.code_import)
        })
      }
      referentiel.map(ref => {
        const res = ref.split('.').filter(elem => elem !== '')
        if (res.length > 1)
          assert.fail()
      })
      assert.strictEqual(response.status, 200)
    })
  })
}
