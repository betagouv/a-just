import { createReadStream, existsSync } from 'fs'
import mime from 'mime'
import Route from './Route'
import config from 'config'

@Route.Route({
  routeBase: '',
})
// eslint-disable-next-line
export default class RouteIndex extends Route {
  constructor(params) {
    super({ ...params })
  }

  @Route.Get({
    path: '*',
  })
  async readFile(ctx) {
    const file = `${__dirname}/../front${decodeURIComponent(ctx.request.url)}`

    if (ctx.request.url && ctx.request.url !== '/' && existsSync(file)) {
      console.log('load page', file)

      const src = createReadStream(file)
      ctx.type = mime.getType(file)
      ctx.body = src
    } else {
      if (config.forceSSL && !ctx.secure) {
        ctx.res
          .writeHead(301, {
            Location: `https://${ctx.request.header.host}${ctx.request.url}`,
          })
          .end()
      } else {
        const indexFile = `${__dirname}/../front/index.html`
        const src = createReadStream(indexFile)
        ctx.type = mime.getType(indexFile)
        ctx.body = src
      }
    }
  }
}
