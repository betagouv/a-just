import { JURIDICTION_BACKUP_ID } from '../constants/juridiction'
import { MAGISTART_ID, GREFFIER_ID } from '../constants/hrCategories'
import { onSaveCle, onGetAllCle } from '../routes/panorama'
import { onLoginApi, onLogoutApi } from '../routes/user'
import config from 'config'
import { assert } from 'chai'

module.exports = function (datas) {
  const siegeCle = 10
  const greffierCle = 7

  describe('Panorama Page', () => {
    /**
     * Sauvegarde d'une valeur pour la CLE (au Siege)
     */
    it('Save CLE', async () => {
      console.log('🔍 DEBUG: Checking userToken before Save CLE test')
      console.log('   - datas object keys:', Object.keys(datas))
      console.log('   - datas.userToken exists:', datas.userToken ? 'YES' : 'NO')
      console.log('   - datas.userToken type:', typeof datas.userToken)
      console.log('   - datas.userToken value:', datas.userToken ? `${datas.userToken.substring(0, 20)}...` : 'undefined')
      console.log('   - datas.userId:', datas.userId)
      console.log('   - datas.adminToken exists:', datas.adminToken ? 'YES' : 'NO')

      const response = await onSaveCle(JURIDICTION_BACKUP_ID, MAGISTART_ID, siegeCle, datas.userToken) // On enregistre une CLE de valeur 10 pour la catégorie magistrat

      assert.strictEqual(response.status, 200)
    })

    /**
     * Vérification que la valeur renseignée précédement est bien sauvegardé
     */
    it('Get CLE must be equal to saved CLE in test right before', async () => {
      const response = await onGetAllCle(JURIDICTION_BACKUP_ID, datas.userToken)
      const element = response.data.data.find(elem => elem.category_id === MAGISTART_ID)

      assert.strictEqual(response.status, 200)
      assert.equal(element.value, siegeCle)
    })

    /**
     * Sauvegarde d'une valeur de CLE pour la catégorie 'Greffe'
     */
    it('Save CLE to other category', async () => {
      const response = await onSaveCle(JURIDICTION_BACKUP_ID, GREFFIER_ID, greffierCle, datas.userToken) // On enregistre une CLE de valeur 7 pour la catégorie greffier

      assert.strictEqual(response.status, 200)
    })

    /**
     * Vérification que la valeur renseigné au Siege n'a pas été modifié et que la nouvelle valeur renseignée pour le Greffe est bien sauvegardée
     */
    it('Check that value in Siege has not changed and that value for Greffier category is the one registered right before', async () => {
      const response = await onGetAllCle(JURIDICTION_BACKUP_ID, datas.userToken)
      const elementSiege = response.data.data.find(elem => elem.category_id === MAGISTART_ID)
      const elementGreffier = response.data.data.find(elem => elem.category_id === GREFFIER_ID)

      assert.strictEqual(response.status, 200)
      assert.equal(elementSiege.value, siegeCle)
      assert.equal(elementGreffier.value, greffierCle)
    })

    /**
     * Vérification que l'on puisse écraser une valeur par une autre
     */
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


    // it('Effectif Composition - Add an agent to a category and verify it is saved correctly', async () => {
    
    
    // })
  })
}
