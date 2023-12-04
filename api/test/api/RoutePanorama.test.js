import { assert } from 'chai'
import { JURIDICTION_BACKUP_ID } from '../constants/juridiction'
import { MAGISTART_ID } from '../constants/hrCategories'
import { onSaveCle, onGetAllCle } from '../routes/panorama'
import { onLoginApi, onLogoutApi } from '../routes/user'
import { USER_TEST_EMAIL, USER_TEST_PASSWORD } from '../constants/user'
import config from 'config'

module.exports = function (datas) {
  describe('Panorama Page', () => {
    it('Save CLE', async () => {
      const response = await onSaveCle(JURIDICTION_BACKUP_ID, MAGISTART_ID, 10, datas.userToken) // On enregistre une CLE de valeur 10 pour la catégorie magistrat

      assert.strictEqual(response.status, 200)
    })

    it('Get CLE must be equal to saved CLE in test right before', async () => {
      const response = await onGetAllCle(JURIDICTION_BACKUP_ID, datas.userToken) //Voir valeur categoryId
      const element = response.data.data.find(elem => elem.category_id === MAGISTART_ID)

      assert.strictEqual(response.status, 200)
      assert.strictEqual(element.value, '10')
    })

    it('Add new CLE value to same category and check that old value is replaced', async () => {
      const response_addCLE = await onSaveCle(JURIDICTION_BACKUP_ID, MAGISTART_ID, 17, datas.userToken) // On enregistre une CLE de valeur 17 pour la catégorie magistrat
      if (response_addCLE.status === 200) {
        const response_getCle = await onGetAllCle(JURIDICTION_BACKUP_ID, datas.userToken) //Voir valeur categoryId
        const element = response_getCle.data.data.find(elem => elem.category_id === MAGISTART_ID)
        
        assert.strictEqual(response_getCle.status, 200)
        assert.strictEqual(element.value, '17')
      }
      else assert.fail()
    })

})
}
