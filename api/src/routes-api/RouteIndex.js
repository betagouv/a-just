import Route from './Route'
import packageJson from '../../package.json'

@Route.Route({
  routeBase: '',
})
class RouteIndex extends Route {
  constructor (params) {
    super({ ...params })
  }

  @Route.Get({ path: '/' })
  index (ctx) {
    this.sendOk(ctx, {
      name: packageJson.name,
      version: packageJson.version,
    })
  }
}

export default RouteIndex