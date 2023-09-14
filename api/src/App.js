const tracer = require('dd-trace').init({
  logInjection: true,
})
import { join } from 'path'
import { App as AppBase } from 'koa-smart'
const koaBody = require('koa-body')
import { i18n, compress, cors, helmet, addDefaultBody } from 'koa-smart/middlewares'
import config from 'config'
import auth from './routes-api/middlewares/authentification'
import givePassword from './routes-logs/middlewares/givePassword'
import db from './models'
import { start as startCrons } from './crons'
import logger from './utils/log'
import koaLogger from 'koa-logger-winston'
import csp from 'koa-csp'
import { tracingMiddleWare, requestHandler } from './utils/sentry'

export default class App extends AppBase {
  // the starting class must extend appBase, provided by koa-smart
  constructor () {
    super({
      port: config.port,
      // routeParam is an object and it will be give as parametter to all routes
      // so for example you can give models to all your route so you can access on route
      routeParam: {},
    })
  }

  async start () {
    db.migrations().then(() => {
      db.seeders().then(() => {
        startCrons(this) // start crons
        console.log('--- IS READY ---')
        this.isReady()
      })
    })

    this.models = db.initModels()
    this.routeParam.models = this.models
    this.routeParam.replicaModels = this.replicaModels
    this.koaApp.context.sequelize = db.instance
    this.koaApp.context.models = this.models

    super.addMiddlewares([
      // we add the relevant middlewares to our API
      //cors({ origin: config.corsUrl, credentials: true }), // add cors headers to the requests
      cors({ credentials: true }), // add cors headers to the requests
      helmet(), // adds various security headers to our API's responses
      koaBody({
        multipart: true,
        formLimit: '512mb',
        textLimit: '512mb',
        jsonLimit: '512mb',
      }), // automatically parses the body of POST/PUT/PATCH requests, and adds it to the koa context
      i18n(this.koaApp, {
        directory: join(__dirname, 'locales'),
        extension: '.json',
        locales: ['en', 'fr'],
        modes: ['query', 'subdomain', 'cookie', 'header', 'tld'],
      }), // allows us to easily localize the API
      auth,
      koaLogger(logger),
      addDefaultBody(), // if no body is present, put an empty object "{}" in its place.
      compress({}), // compresses requests made to the API
      givePassword,
      requestHandler,
      tracingMiddleWare,
      /*csp({
        enableWarn: true,
        policy: {
          'default-src': ['none'],
          'connect-src': [
            'https://www.google-analytics.com/j/collect',
            "'self'",
            'https://api.mapbox.com',
            'https://events.mapbox.com',
            'https://stats.data.gouv.fr',
            'https://forms-eu1.hsforms.com',
            'https://hubspot-forms-static-embed-eu1.s3.amazonaws.com',
          ],
          'font-src': ["'self'", 'https://fonts.gstatic.com', 'data:'],
          'img-src': ["'self'", 'data:', 'https://js-eu1.hsforms.net', 'https://api.hubspot.com', 'https://forms-eu1.hsforms.com', 'https://forms.hsforms.com'],
          'script-src': [
            "'unsafe-eval'",
            "'self'",
            "'unsafe-inline' https://js-eu1.hsforms.net",
            "'unsafe-inline' https://www.google-analytics.com/analytics.js",
            'stats.data.gouv.fr',
          ],
          'worker-src': ['blob:'],
          'style-src': ["'self'", "'unsafe-inline'"],
          'frame-src': ['https://docs.a-just.beta.gouv.fr', 'https://meta.a-just.beta.gouv.fr', 'https://forms-eu1.hsforms.com/'],
        },
      }),*/
    ])

    super.mountFolder(join(__dirname, 'routes-logs'), '/logs/') // adds a folder to scan for route files
    super.mountFolder(join(__dirname, 'routes-api'), '/api/') // adds a folder to scan for route files
    super.mountFolder(join(__dirname, 'routes-admin'), '/admin/') // adds a folder to scan for route files
    super.mountFolder(join(__dirname, 'routes'), '/') // adds a folder to scan for route files

    return super.start()
  }

  isReady () {}

  done () {
    console.log('--- DONE ---')
    process.exit()
  }
}
