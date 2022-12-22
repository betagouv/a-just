import { createReadStream, existsSync } from 'fs'
import mime from 'mime'
import Route from './Route'

/**
 * Route pour accéder aux dossier public
 */

export default class RoutePublic extends Route {
  /**
   * Constructeur
   * @param {*} params
   */
  constructor (params) {
    super({ ...params })
  }

  /**
   * Interface qui écoute tout les urls et retourne le fichier existant
   */
  @Route.Get({
    path: '*',
  })
  async readFile (ctx) {
    const file = `${__dirname}/..${ctx.request.url.replace('/api/', '/')}`
    console.log(file, existsSync(file))

    if (existsSync(file)) {
      const src = createReadStream(file)
      ctx.type = mime.getType(file)
      ctx.body = src
    }

    this.sendOk(ctx, 'OK')
  }
}
