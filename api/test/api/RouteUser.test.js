import axios from 'axios'
import config from 'config'
import { assert } from 'chai'

module.exports = function () {
  let adminToken = null
  let userId = null
  let userToken = null

  describe('Users tests', () => {
    /**
     * Connect Admin
     */
    it('Login - Login admin', async () => {
      const email = 'redwane.zafari@a-just.fr'
      const password = '123456'

      // Connexion de l'admin
      const response = await axios.post(`${config.serverUrl}/auths/login-admin`, {
        email,
        password,
      })
      // Récupération du token associé pour l'identifier
      adminToken = response.data.token
      assert.strictEqual(response.status, 201)
    })

    /**
     *  Vérification qu'on ait bien un erreur si le mail n'est pas indiqué
     */
    it('Sign up - Missing email, should return 400', async () => {
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
    it('Sign up - Missing password, should return 400', async () => {
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
    it('Sign up - Missing email and password, should return 400', async () => {
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
    it('Sign up - Correct inputs, should return 200', async () => {
      const response = await axios.post(`${config.serverUrl}/users/create-account`, {
        email: 'test@mail.com',
        password: '123456',
        firstName: 'userTest',
        lastName: 'userTest',
        fonction: 'tester',
      })
      assert.strictEqual(response.status, 200)
    })

    /**
     * Vérification qu'on ait bien une erreur si l'email indiqué n'est pas reconnu
     */
    it('Forgot password - Bad email, should return 401', async () => {
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
    it('Forgot password - Good email, should return 200', async () => {
      const response = await axios.post(`${config.serverUrl}/users/forgot-password`, {
        email: 'test@mail.com',
      })

      assert.strictEqual(response.status, 200)
    })

    /**
     * Vérification qu'on ait bien un erreur si le mot de passe n'est pas correct
     */
    it('Login - Bad password, should return 401', async () => {
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
    it('Login - Bad email, should return 401', async () => {
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
    it('Login - Bad email AND bad password, should return 401', async () => {
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
     * Vérification que la connexion avec les bonnes infos fonctionne
     */
    it('Login - Login should succeed and return 201 with user token', async () => {
      const email = 'test@mail.com'
      const password = '123456'

      const response = await axios.post(`${config.serverUrl}/auths/login`, {
        email,
        password,
      })
      userToken = response.status === 201 && response.data.token
      userId = response.data.user.id
      console.log('USER ID', userId)

      assert.isOk(userToken, 'response 201 and user token created')
    })

    /**
     * Get my info as a user
     */
    it('Get my infos as a user. Should return 200', async () => {
      const response = await axios.get(`${config.serverUrl}/users/me`, {
        headers: {
          authorization: userToken,
        },
      })
      assert.strictEqual(response.status, 200)
    })

    /**
     * Get my datas as a connected user
     */
    it('Get my datas as a connected user. Should return 200', async () => {
      const response = await axios.get(`${config.serverUrl}/users/get-user-datas`, {
        headers: {
          authorization: userToken,
        },
      })
      assert.strictEqual(response.status, 200)
    })
    /**
     * Vérification qu'un simple utilisateur ne puisse accéder à la liste complète des utilisateurs
     */
    it('User list - Normal user do not have access. Should return 403', async () => {
      try {
        await axios.get(`${config.serverUrl}/users/get-all`, {
          headers: {
            authorization: userToken,
          },
        })
      } catch (error) {
        assert.strictEqual(error.response.status, 403)
      }
    })

    /**
     * Vérification qu'un admin puisse accéder à la liste complète des utilisateurs
     */
    it('User list - Admin should have access. Should return 200', async () => {
      const response = await axios.get(`${config.serverUrl}/users/get-all`, {
        headers: {
          authorization: adminToken,
        },
      })

      assert.strictEqual(response.status, 200)
    })

    /**
     * Vérification que l'utilisateur peur bien se déconnecter
     */
    it('Logout - Logout should return 200', async () => {
      const response = await axios.get(`${config.serverUrl}/auths/logout`, {
        headers: {
          authorization: userToken,
        },
      })
      assert.strictEqual(response.status, 200)
    })

    /**
     * Vérification qu'un admin puisse bien surrpimer le compte d'un utilisateur
     */
    it('Remove user Account by admin', async () => {
      const response = await axios.delete(`${config.serverUrl}/users/remove-account-test/${userId}`, {
        headers: {
          authorization: adminToken,
        },
      })
      assert.strictEqual(response.status, 200)
    })
  })
}
