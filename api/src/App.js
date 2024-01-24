import { join } from 'path'
import { App as AppBase } from 'koa-smart'
const koaBody = require('koa-body')
import { i18n, compress, cors, addDefaultBody } from 'koa-smart/middlewares'
import config from 'config'
import auth from './routes-api/middlewares/authentification'
import sslMiddleware from './routes-api/middlewares/ssl'
import givePassword from './routes-logs/middlewares/givePassword'
import db from './models'
import { start as startCrons } from './crons'
import logger from './utils/log'
import koaLogger from 'koa-logger-winston'
import { tracingMiddleWare, requestHandler } from './utils/sentry'
import helmet from 'koa-helmet'
import { CSP_URL_IGNORE_RULES } from './constants/csp'
const RateLimit = require('koa2-ratelimit').RateLimit

/*var os = require('os')
var osu = require('node-os-utils')

var cpu = osu.cpu

// CONTROL EVERY 30S
setInterval(() => {
  console.log('MEM', os.freemem(), os.totalmem(), os.freemem() / os.totalmem())
  var count = cpu.count() // 8

  cpu.usage().then((cpuPercentage) => {
    console.log('CPU', count, cpuPercentage) // 10.38
  })

  var osCmd = osu.osCmd

  osCmd.whoami().then((userName) => {
    console.log('WHO I AM', userName) // admin
  })
}, 30000)*/

export default class App extends AppBase {
  // the starting class must extend appBase, provided by koa-smart
  constructor() {
    super({
      port: config.port,
      // routeParam is an object and it will be give as parametter to all routes
      // so for example you can give models to all your route so you can access on route
      routeParam: {},
    })
  }

  async start() {
    db.migrations().then(() => {
      db.seeders().then(() => {
        startCrons(this) // start crons
        console.log('--- IS READY ---')
        this.isReady()

        /** PASSWORD TESTER to move to unit tests ?
        setTimeout(() => {
          const password_to_test = ['sdf', 'azerty', 'fxsurunbateau', 'ajust', 'fxaviermontigny']
          for (let i = 0; i < password_to_test.length; i++) {
            try {
              console.log('----------\n')
              console.log(cryptPassword(password_to_test[i], 'fxaviermontigny@gmail.com'))
            } catch (err) {
              console.error(err)
            }
          }
        }, 100) */
      })
    })

    this.models = db.initModels()
    this.routeParam.models = this.models
    this.routeParam.replicaModels = this.replicaModels
    this.koaApp.context.sequelize = db.instance
    this.koaApp.context.models = this.models

    const limiter = RateLimit.middleware({
      interval: { min: 5 }, // 5 minutes = 5*60*1000
      max: config.maxQueryLimit, // limit each IP to 100 requests per interval
    })

    super.addMiddlewares([
      //sslify(),
      limiter,
      // we add the relevant middlewares to our API
      cors({ origin: config.corsUrl, credentials: true }), // add cors headers to the requests
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
      sslMiddleware,
      koaLogger(logger),
      addDefaultBody(), // if no body is present, put an empty object "{}" in its place.
      compress({}), // compresses requests made to the API
      givePassword,
      requestHandler,
      tracingMiddleWare,
      helmet({
        // https://github.com/helmetjs/helmet
        contentSecurityPolicy: {
          directives: {
            'connect-src': [
              'https://api.gitbook.com',
              'https://www.google-analytics.com/j/collect',
              "'self'",
              'https://api.mapbox.com',
              'https://events.mapbox.com',
              'https://stats.beta.gouv.fr',
              'https://forms-eu1.hsforms.com',
              'https://hubspot-forms-static-embed-eu1.s3.amazonaws.com',
              'stonly.com',
              '*.stonly.com',
              'https://stats.beta-gouv.cloud-ed.fr',
            ],
            'font-src': ["'self'", 'https://fonts.gstatic.com', 'data:'],
            'img-src': [
              "'self'",
              'data:',
              'https://js-eu1.hsforms.net',
              'https://api.hubspot.com',
              'https://forms-eu1.hsforms.com',
              'https://forms.hsforms.com',
              'https://www.ionos.fr',
              'https://img.freepik.com',
              'https://image.noelshack.com',
              'https://i.goopics.net/'
            ],
            'script-src': [
              "'report-sample' 'self'",
              'https://*.hsforms.net',
              '*.beta.gouv.fr',
              '*.a-just.incubateur.net',
              'stonly.com',
              '*.stonly.com',
              '*.calendly.com',
              '*.google-analytics.com',
            ],
            'script-src-elem': [
              "'self'",
              '*.beta.gouv.fr',
              '*.a-just.incubateur.net',
              '*.hsforms.net',
              '*.calendly.com',
              'stonly.com',
              '*.stonly.com',
              '*.google-analytics.com',
            ],
            'worker-src': ['blob:'],
            'style-src': ["'self'", "'unsafe-inline'", 'cdnjs.cloudflare.com'],
            'frame-src': [
              'https://docs.a-just.beta.gouv.fr',
              'https://meta.a-just.beta.gouv.fr',
              'https://forms-eu1.hsforms.com/',
              'https://calendly.com',
              'stonly.com',
              '*.stonly.com',
              '*.hubspot.com',
            ],
            'object-src': ["'self'"],
            //'report-uri': ['/api/csp/report'],
            'base-uri': ["'self'"],
            'form-action': ["'self'"],
            'upgrade-insecure-requests': [],
          },
          //reportOnly: true,
        },
        crossOriginEmbedderPolicy: false,
        crossOriginOpenerPolicy: false,
        crossOriginResourcePolicy: false,
        originAgentCluster: false,
        referrerPolicy: false,
        strictTransportSecurity: {
          maxAge: 31536000,
          includeSubDomains: false,
        },
        xContentTypeOptions: 'nosniff',
        xDnsPrefetchControl: false,
        xDownloadOptions: false,
        xFrameOptions: { action: 'sameorigin' },
        xPermittedCrossDomainPolicies: false,
        xPoweredBy: false,
        //xXssProtection: 1, don't work
      }),
      async (ctx, next) => {
        ctx.set('x-xss-protection', '1')

        if (CSP_URL_IGNORE_RULES.indexOf(ctx.url) !== -1) {
          ctx.set('content-security-policy', '')
        }
        await next()
      },
    ])

    super.mountFolder(join(__dirname, 'routes-logs'), '/logs/') // adds a folder to scan for route files
    super.mountFolder(join(__dirname, 'routes-api'), '/api/') // adds a folder to scan for route files
    super.mountFolder(join(__dirname, 'routes-admin'), '/ap-bo/') // adds a folder to scan for route files
    super.mountFolder(join(__dirname, 'routes'), '/') // adds a folder to scan for route files

    return super.start()
  }

  isReady() { }

  done() {
    console.log('--- DONE ---')
    process.exit()
  }
}

