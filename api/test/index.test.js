import { default as server } from '../dist/index'
import routeIndex from './api/Route.test'
import routeImport from './api/RouteImports.test'

describe('Test server is ready', () => {
  before((done) => {
    server.isReady = function () {
      done()
    }
  })

  routeIndex()
  routeImport()

  after(function () {
    server.done()
  })
})
