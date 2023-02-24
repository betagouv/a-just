import { default as server } from '../dist/index'
import routeIndex from './api/Route.test'
import routeAuth from './api/RouteAuth.test'
import routeUser from './api/RouteUser.test'
import routeUnauthorizedAccess from './api/RouteUnauthorizedAccess.test'
/*import routeImport from './api/RouteImports.test'
import routeHR from './api/RouteHR.test'
import routeActivities from './api/RouteActivities.test'
import RouteContentieuxOptions from './api/RouteContentieuxOptions.test'*/
import config from 'config'

describe('Test server is ready', () => {
  before((done) => {
    console.log('BEFORE WAITING SERVER')
    server.isReady = function () {
      console.log('config', config)
      done()
    }
  })
  let adminToken = null
  let userId = null

  routeIndex()
  routeUser(adminToken, userId),
  routeAuth(adminToken, userId),
  routeUnauthorizedAccess(adminToken, userId),
  //routeChangeData(),
  /*routeImport()
  routeHR()
  routeActivities()
  RouteContentieuxOptions()*/

  after(function () {
    server.done()
  })
})
