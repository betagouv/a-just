import { join } from 'path'
import { App as AppBase, middlewares } from 'koa-smart'
const { i18n, compress, cors, addDefaultBody, logger } = middlewares
import koaBody from 'koa-body'
import config from 'config'
import auth from './routes-api/middlewares/authentification'
import sslMiddleware from './routes-api/middlewares/ssl'
import honeyTrap from './routes-api/middlewares/honeyTrap'
import givePassword from './routes-logs/middlewares/givePassword'
import db from './models'
import { start as startCrons } from './crons'
import helmet from 'koa-helmet'
import { CSP_URL_IGNORE_RULES } from './constants/csp'
import session from 'koa-session'
import RedisStore from 'koa-redis'
import { RateLimit } from 'koa2-ratelimit'
import { styleSha1Generate } from './utils/csp'
import * as Sentry from '@sentry/node'

const os = require('os')
console.log('HOST NAME', os.hostname())

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
    if (os.hostname().includes('web-1') || !os.hostname().includes('web')) {
      console.log('--- STARTING MIGRATIONS ---')
      db.migrations().then(() => {
        db.seeders().then(() => {
          console.log('--- STARTING CRONS ---')
          startCrons(this) // start crons
          console.log('--- IS READY ---', config.port, os.hostname())
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
    } else {
      console.log('--- IS READY ---', config.port, os.hostname())
      this.isReady()
    }

    this.models = db.initModels()
    this.routeParam.models = this.models
    this.routeParam.replicaModels = this.replicaModels
    this.koaApp.context.sequelize = db.instance
    this.koaApp.context.models = this.models
    // (session) - required for cookie signature generation
    this.koaApp.keys = ['oldsdfsdfsder secdsfsdfsdfret key']
    this.koaApp.proxy = true

    const limiter = RateLimit.middleware({
      interval: { min: 5 }, // 5 minutes = 5*60*1000
      max: config.maxQueryLimit, // limit each IP to 100 requests per interval
    })

    this.koaApp.use(async (ctx, next) => {
      return await honeyTrap(ctx, next, this.models)
    })

    const sessionConfig = { ...config.session }
    if (config.redis) {
      const redisUrlSplited = config.redis.split('@')
      const redisConfig = {}
      if (redisUrlSplited.length > 1) {
        const redisUrl = redisUrlSplited[redisUrlSplited.length - 1].split(':')
        const redisAccount = redisUrlSplited[0].split(':')
        redisConfig.host = redisUrl[0]
        redisConfig.port = redisUrl[1]
        redisConfig.password = redisAccount[redisAccount.length - 1]
      } else {
        const redisUrl = redisUrlSplited[redisUrlSplited.length - 1].split(':')
        redisConfig.host = redisUrl[1].replace('//', '')
        redisConfig.port = redisUrl[2]
      }
      sessionConfig.store = new RedisStore(redisConfig)
    }

    this.koaApp.use(session(sessionConfig, this.koaApp))
    Sentry.setupKoaErrorHandler(this.koaApp)

    super.addMiddlewares([
      //sslify(),
      limiter,
      // we add the relevant middlewares to our API
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
      logger(),
      addDefaultBody(), // if no body is present, put an empty object "{}" in its place.
      compress({}), // compresses requests made to the API
      givePassword,
      helmet({
        // https://github.com/helmetjs/helmet
        contentSecurityPolicy: {
          directives: {
            'media-src': ["'self'", 'https://client.crisp.chat'],
            'connect-src': [
              'https://api.gitbook.com',
              'https://www.google-analytics.com/j/collect',
              "'self'",
              'https://api.mapbox.com',
              'https://events.mapbox.com',
              'https://stats.beta.gouv.fr',
              'https://forms-eu1.hsforms.com',
              'https://hubspot-forms-static-embed-eu1.s3.amazonaws.com',
              'https://stats.beta-gouv.cloud-ed.fr',
              'https://*.hotjar.com',
              'https://*.hotjar.io',
              'wss://*.hotjar.com',
              '*.justice.gouv.fr',
              'https://client.crisp.chat',
              'https://storage.crisp.chat',
              'wss://client.relay.crisp.chat',
              'wss://stream.relay.crisp.chat',
            ],
            'font-src': ["'self'", 'https://fonts.gstatic.com', 'data:', 'https://*.hotjar.com', 'https://client.crisp.chat'],
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
              'https://i.goopics.net/',
              'https://client.crisp.chat',
              'https://image.crisp.chat',
              'https://storage.crisp.chat',
            ],
            // "img-src": [
            //   "'self'",
            //   "data:",
            //   "https://js-eu1.hsforms.net",
            //   "https://api.hubspot.com",
            //   "https://forms-eu1.hsforms.com",
            //   "https://forms.hsforms.com",
            //   "https://www.ionos.fr",
            //   "https://img.freepik.com",
            //   "https://image.noelshack.com",
            //   "https://i.goopics.net/",
            // ],
            'script-src': [
              "'self'",
              'https://*.hsforms.net',
              '*.beta.gouv.fr',
              '*.a-just.incubateur.net',
              '*.calendly.com',
              '*.google-analytics.com',
              '*.hotjar.com',
              "'sha256-jq7VWlK1R1baYNg3rH3wI3uXJc6evRSm19ho/ViohcE='",
              "'sha256-92TNq2Axm9gJIJETcB7r4qpDc3JjxqUYF1fKonG4mvg='",
              "'sha256-WXdHEUxHRTHqWKtUCBtUckcV5wN4y9jQwkZrGjfqr40='",
              "'sha256-9jsqNCkYsDU3te2WUjv9qXV1DKXI1vT9hz3g7nNens8='",
              "'sha256-Z/I+tLSqFCDH08E3fvI/F+QNinxE6TM+KmCxNmRcAAw='",
              "'sha256-tBBLGYs6fvYemOy9hpbgu6tIIJNpdIZpuGpDXkhGTVw='",
              "'sha256-HVge3cnZEH/UZtmZ65oo81F6FB06/nfTNYudQkA58AE='",
              "'sha256-6x6g2SYysPsSMI15om2cLqbYnqaoyjXQD+Aivk9OP4U='",
              "'sha256-A+0b+HOyTgrPPZgW1Tcb6UJIvj7fs09WPLWFtyqq1ks='",
              //...scriptSha1Generate([`${__dirname}/front/index.html`]),
              'https://client.crisp.chat',
              'https://settings.crisp.chat',
            ],
            'default-src': ["'none'"],
            'style-src': [
              "'self'",
              ...styleSha1Generate([`${__dirname}/front/index.html`]),
              'cdnjs.cloudflare.com',
              "'sha256-Ks+4bfA56EzWbsVt5/a+A7rCibdXWRQVb7y2dkDLIZM='",
              "'sha256-MKASWYfd3dGFQes9nQT5XnslE3xYlnUb4cHpxhk4fag='",
              "'sha256-eK2nDKvEyw7RbvnsAc4UTeSvLsouV8qnHxl0X48dCbs='",
              'https://client.crisp.chat',
              "'sha256-7Vo533bZB5hNdpZy9SiCUDc3JcgD9jqDXEc9aVAk5nY='",
              "'sha256-UP0QZg7irvSMvOBz9mH2PIIE28+57UiavRfeVea0l3g='",
              "'sha256-Mj/pDR/CuVebTo+8zwX6PU1+MXNnrzFL+dgRa0Q0JF0='",
              "'sha256-BUZLvafdn4L6W6euGkBpnDrFVzIGLdSRjgp2e2gC+NE='",
            ],
            'worker-src': ['blob:'],
            'frame-src': [
              'https://app.videas.fr/',
              'https://docs.a-just.beta.gouv.fr',
              'https://meta.a-just.beta.gouv.fr',
              'https://forms-eu1.hsforms.com/',
              'https://calendly.com',
              'https://game.crisp.chat',
            ],
            'worker-src': ['blob:'],
            'frame-src': [
              'https://app.videas.fr/',
              'https://docs.a-just.beta.gouv.fr',
              'https://meta.a-just.beta.gouv.fr',
              'https://forms-eu1.hsforms.com/',
              'https://calendly.com',
            ],
            'object-src': ["'self'"],
            //'report-uri': ['/api/csp/report'],
            'base-uri': ["'self'"],
            'form-action': ["'self'", '*.hsforms.com'],
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
        xFrameOptions: { action: 'deny' },
        xPermittedCrossDomainPolicies: false,
        xPoweredBy: false,
        //xXssProtection: 1, don't work
      }),
      async (ctx, next) => {
        //console.log('Client IP', ctx.request.ip)
        ctx.set('x-xss-protection', '1')

        if (CSP_URL_IGNORE_RULES.find((u) => ctx.url.startsWith(u))) {
          ctx.set('content-security-policy', '')
        }

        await next()
      },
    ])

    if (config.corsUrl) {
      super.addMiddlewares([
        cors({ origin: config.corsUrl, credentials: true }), // add cors headers to the requests
      ])
    } else {
      super.addMiddlewares([
        cors({ credentials: true }), // add cors headers to the requests
      ])
    }

    super.mountFolder(join(__dirname, 'routes-logs'), '/logs/') // adds a folder to scan for route files
    super.mountFolder(join(__dirname, 'routes-api'), '/api/') // adds a folder to scan for route files
    super.mountFolder(join(__dirname, 'routes-admin'), '/ap-bo/') // adds a folder to scan for route files
    super.mountFolder(join(__dirname, 'routes-docker'), '/docker/')
    super.mountFolder(join(__dirname, 'routes'), '/') // adds a folder to scan for route files

    return super.start()
  }

  isReady() {}

  done() {
    console.log('--- DONE ---')
    process.exit()
  }
}
