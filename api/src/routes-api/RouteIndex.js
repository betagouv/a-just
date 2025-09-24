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
  // model de BDD
  model

  /**
   * Constructeur
   * @param {*} params
   */
  constructor (params) {
    super(params)
  }

  /**
   * Interface qui retourne les versions du serveur
   */
  /*@Route.Get({ path: '/' })
  index (ctx) {
    this.sendOk(ctx, {
      name: packageJson.name,
      version: packageJson.version,
      envName: config.envName,
    })
  }*/
}

export default RouteIndex
