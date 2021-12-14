import { default as server } from '../dist/index'
import routeIndex from './api/Route.test'
import routeImport from './api/RouteImports.test'
import routeHR from './api/RouteHR.test'
import routeActivities from './api/RouteActivities.test'

describe('Test server is ready', () => {
  before((done) => {
    server.isReady = function () {
      done()
    }
  })

  routeIndex()
  routeImport()
  routeHR()
  routeActivities()

  after(function () {
    server.done()
  })
})
