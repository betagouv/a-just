import { createReadStream, statSync } from 'fs'
import mime from 'mime'
import Route from './Route'
import { REFERENCE_REQUEST_URL } from '../constants/log-codes'

@Route.Route({
  routeBase: '',
})
// eslint-disable-next-line
export default class RouteIndex extends Route {
  constructor(params) {
    super(params)

    this.model = params.models.Logs
  }

  @Route.Get({
    path: '*',
  })
  async readFile(ctx) {
    const ip = ctx.request.ip
    const url = ctx.request.url

    try {
      let file = `${__dirname}/../../dist/front${decodeURIComponent(url)}`
      const fileSplited = file.split('?')
      file = fileSplited.length > 1 ? fileSplited.slice(0, -1).join('?') : file
      const stats = statSync(file)

      if (url && url !== '/' && stats.isFile()) {
        console.log('load page', file)

        // only for video
        if (file.indexOf('.mp4') !== -1) {
          const { range } = ctx.request.headers
          const { size } = stats
          const start = Number((range || '').replace(/bytes=/, '').split('-')[0])
          const end = size - 1
          const chunkSize = end - start + 1
          ctx.set('Content-Range', `bytes ${start}-${end}/${size}`)
          ctx.set('Accept-Ranges', 'bytes')
          ctx.set('Content-Length', chunkSize)
          ctx.set('Content-Type', 'video/mp4')
          ctx.status = 206
          const src = createReadStream(file, { start, end })
          ctx.body = src
          //stream.on('open', () => stream.pipe(res))
          //stream.on('error', (streamErr) => res.end(streamErr))
        } else {
          const src = createReadStream(file)
          ctx.type = mime.getType(file) || 'text/html'
          ctx.body = src
        }
      } else {
        this.model.addLog(REFERENCE_REQUEST_URL, null, ip, { formatValue: false, datas2: url, logging: false })

        const indexFile = `${__dirname}/../../dist/front/index.html`
        const src = createReadStream(indexFile)
        ctx.type = mime.getType(indexFile)
        ctx.body = src
      }
    } catch (err) {
      console.log('on error', err)
      this.model.addLog(REFERENCE_REQUEST_URL, null, ip, { formatValue: false, datas2: url, logging: false })

      const indexFile = `${__dirname}/../../dist/front/index.html`
      const src = createReadStream(indexFile)
      ctx.type = mime.getType(indexFile)
      ctx.body = src
    }
  }
}
