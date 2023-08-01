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
    console.log('config', config, ctx.request)
    if (!config.forceURL && ctx.request?.header?.referer && ctx.request.header.referer.startsWith('http:')) {
      ctx.res
        .writeHead(301, {
          Location: ctx.request.header.referer.replace('http', 'https'),
        })
        .end()
    }

    console.log(ctx)
    let file = `${__dirname}/../front${decodeURIComponent(ctx.request.url)}`
    const fileSplited = file.split('?')
    file = fileSplited.length > 1 ? fileSplited.slice(0, -1).join('?') : file

    if (ctx.request.url && ctx.request.url !== '/' && existsSync(file)) {
      console.log('load page', file)

      const src = createReadStream(file)
      ctx.type = mime.getType(file)
      ctx.body = src
    } else {
      const indexFile = `${__dirname}/../front/index.html`
      const src = createReadStream(indexFile)
      ctx.type = mime.getType(indexFile)
      ctx.body = src
    }
  }
}
