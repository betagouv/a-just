import Route from './Route'
import packageJson from '../../package.json'
import config from 'config'

/**
 * Route racine de l'API
 */

@Route.Route({
  routeBase: '',
})
class RouteIndex extends Route {
  /**
   * Constructeur
   * @param {*} params
   */
  constructor (params) {
    super({ ...params })
  }

  /**
   * Interface qui retourne les versions du serveur
   */
  @Route.Get({ path: '/' })
  index (ctx) {
    console.log('OUIII')
    this.sendOk(ctx, {
      name: packageJson.name,
      version: packageJson.version,
      envName: config.envName,
    })
  }
}

export default RouteIndex
