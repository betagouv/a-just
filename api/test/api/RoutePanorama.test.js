import { assert } from 'chai'
import { JURIDICTION_BACKUP_ID } from '../constants/juridiction'
import { MAGISTART_ID, GREFFIER_ID } from '../constants/hrCategories'
import { onSaveCle, onGetAllCle } from '../routes/panorama'
import { onLoginApi, onLogoutApi } from '../routes/user'
import { USER_TEST_EMAIL, USER_TEST_PASSWORD } from '../constants/user'
import config from 'config'

module.exports = function (datas) {
  const siegeCle = 10
  const greffierCle = 7

  describe('Panorama Page', () => {
    it('Save CLE', async () => {
      const response = await onSaveCle(JURIDICTION_BACKUP_ID, MAGISTART_ID, siegeCle, datas.userToken) // On enregistre une CLE de valeur 10 pour la catégorie magistrat

      assert.strictEqual(response.status, 200)
    })

    it('Get CLE must be equal to saved CLE in test right before', async () => {
      const response = await onGetAllCle(JURIDICTION_BACKUP_ID, datas.userToken)
      const element = response.data.data.find(elem => elem.category_id === MAGISTART_ID)

      assert.strictEqual(response.status, 200)
      assert.equal(element.value, siegeCle)
    })

    it('Save CLE to other category', async () => {
      const response = await onSaveCle(JURIDICTION_BACKUP_ID, GREFFIER_ID, greffierCle, datas.userToken) // On enregistre une CLE de valeur 7 pour la catégorie greffier

      assert.strictEqual(response.status, 200)
    })

    it('Check that value in Siege has not changed and tha value for Greffier category is the one registered right before', async () => {
      const response = await onGetAllCle(JURIDICTION_BACKUP_ID, datas.userToken)
      const elementSiege = response.data.data.find(elem => elem.category_id === MAGISTART_ID)
      const elementGreffier = response.data.data.find(elem => elem.category_id === GREFFIER_ID)

      assert.strictEqual(response.status, 200)
      assert.equal(elementSiege.value, siegeCle)
      assert.equal(elementGreffier.value, greffierCle)
    })

    it('Add new CLE value to same category and check that old value is replaced', async () => {
      const response_addCLE = await onSaveCle(JURIDICTION_BACKUP_ID, MAGISTART_ID, 17, datas.userToken) // On enregistre une CLE de valeur 17 pour la catégorie magistrat
      if (response_addCLE.status === 200) {
        const response_getCle = await onGetAllCle(JURIDICTION_BACKUP_ID, datas.userToken)
        const element = response_getCle.data.data.find(elem => elem.category_id === MAGISTART_ID)
        
        assert.strictEqual(response_getCle.status, 200)
        assert.equal(element.value, '17')
      }
      else assert.fail()
    })

})
}
