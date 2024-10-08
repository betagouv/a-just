import { createReadStream, statSync } from 'fs'
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
    if (config.forceURL && ctx.request?.header?.referer && ctx.request.header.referer.startsWith('http:')) {
      console.log('config redirect', config, ctx.request?.header?.referer)
      ctx.res
        .writeHead(301, {
          Location: ctx.request.header.referer.replace('http', 'https'),
        })
        .end()
      return
    }

    let file = `${__dirname}/../../dist/front${decodeURIComponent(ctx.request.url)}`
    const fileSplited = file.split('?')
    file = fileSplited.length > 1 ? fileSplited.slice(0, -1).join('?') : file
    try {
      const stats = statSync(file)

      if (ctx.request.url && ctx.request.url !== '/' && stats.isFile()) {
        console.log('load page', file)

        const src = createReadStream(file)
        ctx.type = mime.getType(file)
        ctx.body = src
      } else {
        const indexFile = `${__dirname}/../../dist/front/index.html`
        const src = createReadStream(indexFile)
        ctx.type = mime.getType(indexFile)
        ctx.body = src
      }
    } catch (err) {
      const indexFile = `${__dirname}/../../dist/front/index.html`
      const src = createReadStream(indexFile)
      ctx.type = mime.getType(indexFile)
      ctx.body = src
    }
  }
}
