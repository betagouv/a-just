import axios from 'axios'
import config from 'config'
import { assert } from 'chai'

module.exports = function () {
  let userToken = null
  let userId = null

  /**
   *  Test la partie inscription d'un utilisateur
   */
  describe('Sign up', () => {
    /**
     *  Vérification qu'on ait bien un erreur si le mail n'est pas indiqué
     */
    it('Missing email, should return 400', async () => {
      try {
        await axios.post(`${config.serverUrl}/users/create-account`, {
          password: '123456',
          firstName: 'userTest',
          lastName: 'userTest',
          fonction: 'tester',
        })
      } catch (error) {
        assert.strictEqual(error.response.status, 400)
      }
    })
    /**
     *  Vérification qu'on ait bien un erreur si le mot de passe n'est pas indiqué
     */
    it('Missing password, should return 400', async () => {
      try {
        await axios.post(`${config.serverUrl}/users/create-account`, {
          email: 'test@mail.com',
          firstName: 'userTest',
          lastName: 'userTest',
          fonction: 'tester',
        })
      } catch (error) {}
    })
    /**
     *  Vérification qu'on ait bien un erreur si l'email et le mot de passe ne sont pas indiqués
     */
    it('Missing email and password, should return 400', async () => {
      try {
        await axios.post(`${config.serverUrl}/users/create-account`, {
          firstName: 'userTest',
          lastName: 'userTest',
          fonction: 'tester',
        })
      } catch (error) {
        assert.strictEqual(error.response.status, 400)
      }
    })
    /**
     *  Vérification que l'utilisateur peut bien s'inscrire si toutes les information obligatoires sont données
     */
    it('Correct inputs, should return 200', async () => {
      const response = await axios.post(`${config.serverUrl}/users/create-account`, {
        email: 'test@mail.com',
        password: '123456',
        firstName: 'userTest',
        lastName: 'userTest',
        fonction: 'tester',
      })
      assert.strictEqual(response.status, 200)
    })
  })

  /**
   * Tests de connexion censés échoués
   */
  describe('Login', () => {
    /**
     * Vérification qu'on ait bien un erreur si le mot de passe n'est pas correct
     */
    it('Bad password, should return 401', async () => {
      const email = 'test@mail.com'
      const password = '123481349'

      try {
        await axios.post(`${config.serverUrl}/auths/login`, {
          email,
          password,
        })
      } catch (error) {
        assert.notStrictEqual(error.response.status, 201)
      }
    })
    /**
     * Vérification qu'on ait bien un erreur si l'email n'est pas correct
     */
    it('Bad email, should return 401', async () => {
      const email = 'test@mail.fr'
      const password = '123456'

      try {
        await axios.post(`${config.serverUrl}/auths/login`, {
          email,
          password,
        })
      } catch (error) {
        assert.strictEqual(error.response.status, 401)
      }
    })
    /**
     * Vérification qu'on ait bien un erreur si le mot de passe et l'email ne sont pas corrects
     */
    it('Bad email AND bad password, should return 401', async () => {
      const email = 'teste@email.com'
      const password = '124134683'

      try {
        await axios.post(`${config.serverUrl}/auths/login`, {
          email,
          password,
        })
      } catch (error) {
        assert.strictEqual(error.response.status, 401)
      }
    })

    /**
     * Vérification que la connexion avec les bonnes infos focntionne
     */
    it('Login should succeed and return 201 with user token', async () => {
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
  })

  /**
   * Tests de déconnexion censé réuissir
   */
  describe('Logout', () => {
    /**
     * Vérification que l'utilisateur peur bien se déconnecter
     */
    it('Logout should return 200', async () => {
      const response = await axios.get(`${config.serverUrl}/auths/logout`, {
        headers: {
          authorization: userToken,
        },
      })
      assert.strictEqual(response.status, 200)
    })
  })

  /**
   * Test de la fonctionnalité de récupération de mot de passe en cat de perte
   */
  describe('Forgot password', () => {
    /**
     * Vérification qu'on ait bien une erreur si l'email indiqué n'est pas reconnu
     */
    it('Bad email, should return 401', async () => {
      try {
        await axios.post(`${config.serverUrl}/users/forgot-password`, {
          email: 'test@mail.fr',
        })
      } catch (error) {
        assert.strictEqual(error.response.status, 401)
      }
    })
    /**
     * Vérification que l'utilisateur puisse bien changer son mot de passe en cas de perte
     */
    it('Good email, should return 200', async () => {
      const response = await axios.post(`${config.serverUrl}/users/forgot-password`, {
        email: 'test@mail.com',
      })

      assert.strictEqual(response.status, 200)
    })
  })

  /**
   * Test de la possibilité de supprimer un compte (Amdin only for now)
   */
  describe('Remove Account', () => {
    /**
     * Vérification qu'un admin puisse bien surrpimer le compte d'un utilisateur
     */
    it('Remove Account', async () => {
      const email = 'redwane.zafari@a-just.fr'
      const password = '123456'
      let adminToken = null

      // Connexion de l'admini
      const adminConnexion = await axios.post(`${config.serverUrl}/auths/login`, {
        email,
        password,
      })
      // Récupération du token associé pour l'identifier
      adminToken = adminConnexion.data.token

      const response = await axios.delete(`${config.serverUrl}/users/remove-account-test/${userId}`, {
        headers: {
          authorization: adminToken,
        },
      })
      assert.strictEqual(response.status, 200)
    })
  })
}
