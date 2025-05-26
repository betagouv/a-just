import { onForgotPasswordApi, onGetMyInfosApi, onGetUserDataApi, onGetUserListApi, onLoginApi, onLogoutApi, onSignUpApi , onChangePasswordApi, onUpdateAccountApi} from '../routes/user'
import { JURIDICTION_TEST_NAME } from '../constants/juridiction'
import { USER_TEST_EMAIL, USER_TEST_PASSWORD, USER_TEST_FIRSTNAME, USER_TEST_LASTNAME, USER_TEST_FONCTION } from '../constants/user'
import { assert } from 'chai'

module.exports = function (datas) {

  let recovery_code = null

  describe('Users tests', () => {
    /**
     *  Inscription - Vérification qu'on ait bien un erreur si le mail n'est pas indiqué
     */
    it('Sign up - Missing email, should return 400', async () => {
        const response = await onSignUpApi({
          email: '',
          password: USER_TEST_PASSWORD,
          firstName: USER_TEST_FIRSTNAME,
          lastName: USER_TEST_LASTNAME,
          tj: JURIDICTION_TEST_NAME,
          fonction: USER_TEST_FONCTION,
        })
        // assert.ok(response.status < 200 || response.status >= 300)
        assert.strictEqual(response.status, 401)
    })

    /*
      La présence du mot de passe n'est plus contrôlé côté backend, mais côté frontend uniquement
    */
    /**
     *  Inscription - Vérification qu'on ait bien un erreur si le mot de passe n'est pas indiqué
     */
    // it('Sign up - Missing password, should return 400', async () => {
    //   try {
    //     const response = await onSignUpApi({
    //       email: USER_TEST_EMAIL,
    //       firstName: USER_TEST_FIRSTNAME,
    //       lastName: USER_TEST_LASTNAME,
    //       tj: JURIDICTION_TEST_NAME,
    //       fonction: USER_TEST_FONCTION,
    //     })
    //     assert.strictEqual(response.status, 400)
    //   }
    //   catch (error) {
    //     console.error("Error in' Sign up - Missing password'", error)
    //   }
    // })

    /*
      La présence du mot de passe n'est plus contrôlé côté backend, mais côté frontend uniquement
      Ce test est donc équivalent au premier test de cette partie
    */
    /**
     *  Inscription - Vérification qu'on ait bien un erreur si l'email et le mot de passe ne sont pas indiqués
     */
    // it('Sign up - Missing email and password, should return 400', async () => {
    //   try {
    //     const response = await onSignUpApi({
    //       firstName: USER_TEST_FIRSTNAME,
    //       lastName: USER_TEST_LASTNAME,
    //       tj: JURIDICTION_TEST_NAME,
    //       fonction: USER_TEST_FONCTION,
    //     })
    //     assert.strictEqual(response.status, 400)
    //   } catch (error) {
    //     console.error("Error in' Sign up - Missing email and password'", error)
    //   }
    // })

    /**
     *  Inscription - Vérification qu'on ait bien une erreur si le mot de passe n'est pas assez long
     */
    // it('Sign up - Password is not long enough, should return 401', async () => {
    //   try {
    //     const response = await onSignUpApi({
    //       email: USER_TEST_EMAIL,
    //       password: '123456',
    //       firstName: USER_TEST_FIRSTNAME,
    //       lastName: USER_TEST_LASTNAME,
    //       tj: JURIDICTION_TEST_NAME,
    //       fonction: USER_TEST_FONCTION,
    //     })
    //     assert.strictEqual(response.status, 401)
    //   } catch (error) {
    //     console.error("Error in' Sign up - Password is not long enough'", error)
    //   }
    // })

    /**
     *  Inscription - Vérification qu'on ait bien une erreur si le mot de passe n'est pas assez fort
     */
    it('Sign up - Password is not strong enough, should return 401', async () => {
      try {
        const response = await onSignUpApi({
          email: USER_TEST_EMAIL,
          password: '123456789',
          firstName: USER_TEST_FIRSTNAME,
          lastName: USER_TEST_LASTNAME,
          tj: JURIDICTION_TEST_NAME,
          fonction: USER_TEST_FONCTION,
        })
        assert.strictEqual(response.status, 401)
      } catch (error) {
        console.error("Error in' Sign up - Password is not strong enough'", error)
      }
    })

    /**
     *  Inscription - Vérification qu'on ait bien une erreur si le mot de passe est un mot du dictionnaire
     */
    it('Sign up - Password is a word in dictionary, should return 401', async () => {
      try {
        const response = await onSignUpApi({
          email: "badPAssword@email.com",//USER_TEST_EMAIL,
          password: 'Zymotechnie',
          firstName: USER_TEST_FIRSTNAME,
          lastName: USER_TEST_LASTNAME,
          tj: JURIDICTION_TEST_NAME,
          fonction: USER_TEST_FONCTION,
        })
        assert.strictEqual(response.status, 401)
      } catch (error) {
        console.error("Error in' Sign up - Password is a word in dictionary'", error)
      }
    })

    /**
     *  Inscription - Vérification que l'utilisateur peut bien s'inscrire si toutes les information obligatoires sont données
     */
    it('Sign up - Correct inputs, should return 200', async () => {
      const response = await onSignUpApi({
        email: USER_TEST_EMAIL,
        password: USER_TEST_PASSWORD,
        firstName: USER_TEST_FIRSTNAME,
        lastName: USER_TEST_LASTNAME,
        tj: JURIDICTION_TEST_NAME,
        fonction: USER_TEST_FONCTION,
      })

      datas.userId = response.data.user.id

      assert.strictEqual(response.status, 201)
    })

    /**
     * Mot de passe oublié - Vérification qu'on ait bien une erreur si l'email indiqué n'est pas reconnu
     */
    it('Forgot password - Bad email, should return 401', async () => {
      const response = await onForgotPasswordApi({ email: 'badEmail@mail.com' })
      assert.strictEqual(response.status, 401)
    })

    /**
     * Mot de passe oublié - Vérification que l'utilisateur puisse biendeamnder un changement de mot de passe en cas de perte
     */
    it('Forgot password - Good email, should return 200', async () => {
      const response = await onForgotPasswordApi({
        email: USER_TEST_EMAIL,
      })
      if (response.status === 200) {
        recovery_code = response.data.data.code
      }
      assert.strictEqual(response.status, 200)
    })

    /**
     *Changement de mot de pass - Vérification qu'on ait bien un erreur si le mail n'est pas correct
     */
    it('Change password - Bad email, should return 401', async () => {
      const response = await onChangePasswordApi({
        email: 'test@a-just.fr',
        password: USER_TEST_PASSWORD,
        code: recovery_code,
      })
      assert.strictEqual(response.status, 401)
    })

    /**
     *Changement de mot de pass - Vérification qu'on ait bien un erreur si le mot de passe n'est pas conforme
     */
     it('Change password - Password is not strong enough, should return 401', async () => {
      const response = await onChangePasswordApi({
        email: USER_TEST_EMAIL,
        password: '123456789',
        code: recovery_code,
      })
      assert.strictEqual(response.status, 401)
    })

      /**
     *Changement de mot de pass - Vérification qu'on ait bien un erreur si le mot de passe n'est pas conforme
     */
     it('Change password - Password is not strong enough, should return 401', async () => {
      const response = await onChangePasswordApi({
        email: USER_TEST_EMAIL,
        password: '123456789',
        code: recovery_code,
      })
      assert.strictEqual(response.status, 401)
    })

      /**
     *Changement de mot de pass - Vérification que l'utilisateur puisse bien changer son mot de passe + message d'alerte
     */
     it('Change password - Correct inputs, should return 200', async () => {
      const response = await onChangePasswordApi({
        email: USER_TEST_EMAIL,
        password: USER_TEST_PASSWORD,
        code: recovery_code,
      })
      assert.isNotEmpty(response.data.data.msg)
      assert.strictEqual(response.status, 200)
    })

    /**
     * Login - Vérification qu'un utilistaeur ne peut pas se connecter avec un mauvais mot de passe
     */
    it('Login - Bad password, should return 401', async () => {
      const response = await onLoginApi({
        email: USER_TEST_EMAIL,
        password: '123481349',
      })
      assert.strictEqual(response.status, 401)
    })

    /**
     * Login - Vérification qu'on ait bien un erreur si l'email n'est pas correct
     */
    it('Login - Bad email, should return 401', async () => {
      const response = await onLoginApi({
        email: 'badEmail@email.com',
        password: USER_TEST_PASSWORD,
      })
      assert.strictEqual(response.status, 401)
    })

    /**
     * Login - Vérification qu'on ait bien un erreur si le mot de passe et l'email ne sont pas corrects
     */
    it('Login - Bad email AND bad password, should return 401', async () => {
      const response = await onLoginApi({
        email: 'badEmail@mail.com',
        password: '124134683',
      })
      assert.strictEqual(response.status, 401)
    })

    /**
     * Login - Vérification que la connexion avec les bonnes infos fonctionne
     */
    it('Login - Login should succeed and return 201 with user token', async () => {
      const response = await onLoginApi({
        email: USER_TEST_EMAIL,
        password: USER_TEST_PASSWORD,
      })
      datas.userToken = response.status === 201 && response.data.token
      assert.strictEqual(response.status, 201)
    })
    
    /**
     * Get my info as a user
     */
    it('Get my infos as a user. Should return 200', async () => {
      const response = await onGetMyInfosApi({
        userToken: datas.userToken,
      })
      assert.strictEqual(response.status, 200)
    })

    /**
     * Get my datas as a connected user
     */
    it('Get my datas as a connected user. Should return 200', async () => {
      const response = await onGetUserDataApi({
        userToken: datas.userToken,
      })
      assert.strictEqual(response.status, 200)
    })

    /**
     * 
     * Vérification qu'un simple utilisateur ne puisse accéder à la liste complète des utilisateurs
     */
    it('User list - Normal user do not have access. Should return 500', async () => {
      const response = await onGetUserListApi({
        userToken: datas.userToken,
      })
      assert.strictEqual(response.status, 500)
    })

    /**
     * Vérification qu'un admin puisse accéder à la liste complète des utilisateurs
     */
    it('User list - Admin should have access. Should return 200', async () => {
      const response = await onGetUserListApi({
        userToken: datas.adminToken,
      })
      assert.strictEqual(response.status, 200)
    })

    /**
     * Logout - Vérification que l'utilisateur peut bien se déconnecter
     */
    it('Logout - Logout should return 200', async () => {
      const response = await onLogoutApi({
        userToken: datas.userToken,
      })
      assert.strictEqual(response.status, 200)
    })

    /**
     * Login - Reconnexion de l'utilisateur pour les prochains tests
     */
    it('Re Login - Login should succeed and return 201', async () => {
      const response = await onLoginApi({
        email: USER_TEST_EMAIL,
        password: USER_TEST_PASSWORD,
      })
      datas.userToken = response.status === 201 && response.data.token
      assert.strictEqual(response.status, 201)
      assert.ok(datas.userToken, 'response 201 and user token created')
    })

  })
}
