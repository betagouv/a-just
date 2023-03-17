// import axios from 'axios'
// import config from 'config'
// import { assert } from 'chai'
// import { accessList } from '../../src/constants/access'
// import users from '../../src/models/definitions/users'

// module.exports = function () {
//   let adminToken = null
//   let userId = null
//   let userToken = null
//   let hrId = null

//   describe('Change User data test', () => {
//     it('Login - Login admin', async () => {
//       const email = 'fx@a-just.fr'
//       const password = '123456'

//       Connexion de l'admini
//       const response = await axios.post(`${config.serverUrl}/auths/login`, {
//         email,
//         password,
//       })
//       Récupération du token associé pour l'identifier
//       adminToken = response.data.token
//       assert.strictEqual(response.status, 201)
//     })

//     it('Sign up - Create test user', async () => {
//       const response = await axios.post(`${config.serverUrl}/users/create-account`, {
//         email: 'test@mail.com',
//         password: '123456',
//         firstName: 'userTest',
//         lastName: 'userTest',
//         fonction: 'Vacataire',
//         tj: 'ESSAI',
//       })
//       assert.strictEqual(response.status, 200)
//     })

//     it('Login - Log user', async () => {
//       const email = 'test@mail.com'
//       const password = '123456'

//       const response = await axios.post(`${config.serverUrl}/auths/login`, {
//         email,
//         password,
//       })
//       userToken = response.status === 201 && response.data.token
//       userId = response.data.user.id

//       assert.isOk(userToken, 'response 201 and user token created')
//     })

//     /*it('Give user accesses by Admin', async () => {
//       const accessIds = accessList.map((elem) => {
//         return elem.id
//       })
//       try {
//         const response = await axios.post(
//           `${config.serverUrl}/users/update-account`,
//           {
//             userId: userId,
//             access: accessIds,
//             ventilations: '', // { id: 11, label: 'ESSAI' },
//           },
//           {
//             headers: {
//               authorization: adminToken,
//             },
//           }
//         )
//       } catch (error) {
//         console.log('Error:', error)
//       }
//     })*/

//     it('Create new hr', async () => {
//       const hr = {
//         firstName: 'test',
//         lastName: 'test',
//         matricule: '123456',
//         situations: [],
//         indisponibilities: [],
//         updatedAt: new Date(),
//       }
//       const response = await axios.post(
//         `${config.serverUrl}/human-resources/update-hr`,
//         {
//           hr,
//           backupId: 11,
//         },
//         {
//           headers: {
//             authorization: adminToken,
//           },
//         }
//       )
//       hrId = response.data.data.id
//       assert.strictEqual(response.status, 200)
//     })

//     it('Change new hr firstname', async () => {
//       const data = await axios.get(`${config.serverUrl}/human-resources/read-hr/${hrId}`, {
//         headers: {
//           authorization: adminToken,
//         },
//       })

//       const hr = {
//         id: hrId,
//         firstName: 'firstname',
//         lastName: data.data.data.lastName,
//       }
//       const response = await axios.post(
//         `${config.serverUrl}/human-resources/update-hr`,
//         {
//           hr,
//           backupId: 11,
//         },
//         {
//           headers: {
//             authorization: adminToken,
//           },
//         }
//       )
//       assert.strictEqual(response.status, 200)
//     })

//     it('Change new hr lastname', async () => {
//       const data = await axios.get(`${config.serverUrl}/human-resources/read-hr/${hrId}`, {
//         headers: {
//           authorization: adminToken,
//         },
//       })
//       console.log('data response:', data)

//       const hr = {
//         id: hrId,
//         firstName: data.data.data.firstName,
//         lastName: 'lastname',
//       }
//       const response = await axios.post(
//         `${config.serverUrl}/human-resources/update-hr`,
//         {
//           hr,
//           backupId: 11,
//         },
//         {
//           headers: {
//             authorization: adminToken,
//           },
//         }
//       )
//       assert.strictEqual(response.status, 200)
//     })

//     it('Add new hr situation', async () => {
//       const activities = [{ id: 6776, percent: 100, contentieux: { id: 447, label: 'Contentieux Social' } }]
//       const category = { id: 1, label: 'Magistrat', rank: 1 }
//       const dateStart = new Date()
//       const etp = 1
//       const fonction = { id: 22, rank: 1, code: 'P', label: 'PRÉSIDENT' }
//       const situatiuons = [
//         {
//           activities,
//           category,
//           dateStart,
//           etp,
//           fonction,
//         },
//       ]

//       const data = await axios.get(`${config.serverUrl}/human-resources/read-hr/${hrId}`, {
//         headers: {
//           authorization: adminToken,
//         },
//       })
//       console.log('Data:', data.data.data)

//       const hr = {
//         ...data.data.data,
//         situations: situatiuons,
//       }
//       console.log('Data situation:', hr)

//       try {
//         const response = await axios.post(
//           `${config.serverUrl}/human-resources/update-hr`,
//           {
//             hr,
//             backupId: hr.backupId,
//           },
//           {
//             headers: {
//               authorization: adminToken,
//             },
//           }
//         )
//       } catch (err) {
//         console.log('error:', err)
//       }
//       assert.strictEqual(response.status, 200)

//       / A FINIR CETTE PARTIE !
//     })

//     it('Remove created hr', async () => {
//       ⚠️ This route must not be use in code production ! The equivalent route for production is '/human-resources/remove-hr/:hrId'
//       const response = await axios.delete(`${config.serverUrl}/human-resources/remove-hr-test/${hrId}`, {
//         headers: {
//           authorization: adminToken,
//         },
//       })
//       assert.strictEqual(response.status, 200)
//     })

//     it('Remove user Account by admin', async () => {
//       ⚠️ This route must not be use in code production ! The equivalent route for production is '/users/remove-account/:id'
//       const response = await axios.delete(`${config.serverUrl}/users/remove-account-test/${userId}`, {
//         headers: {
//           authorization: adminToken,
//         },
//       })
//       assert.strictEqual(response.status, 200)
//     })
//   })
// }
