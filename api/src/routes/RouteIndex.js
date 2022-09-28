import { createReadStream, existsSync } from 'fs'
import mime from 'mime'
import Route from './Route'

@Route.Route({
  routeBase: '',
})
// eslint-disable-next-line
export default class RouteIndex extends Route {
  constructor(params) {
    super({ ...params });
  }

  @Route.Get({
    path: '*',
  })
  async readFile (ctx) {
    const file = `${__dirname}/../front${ctx.request.url}`
    console.log(file, existsSync(file))

    if(ctx.request.url && ctx.request.url !== '/' && existsSync(file)) {
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
