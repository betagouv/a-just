import { join } from 'path'
import 'dotenv/config'
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
import authBasic from 'http-auth'
import { writeFileSync } from 'fs'
import { getFullKey, getRedisClient, loadOrWarmHR, waitForRedis } from './utils/redis'
import sequelize, { Sequelize } from 'sequelize'

const cspConfig = {
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
}

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

let basicAuth = null

if (config.authPasswordFile) {
  writeFileSync('htaccess.txt', config.authPasswordFile.replace(/\\n/g, '\n'), 'utf8')
  basicAuth = authBasic.basic({
    realm: 'BO',
    file: 'htaccess.txt',
    skipUser: true,
    //proxy: true,
  })
}

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
    const isPrimaryInstance = os.hostname().includes('web-1') || !os.hostname().includes('web')

    // 🧱 Initialisation Sequelize + modèles
    this.models = db.initModels()
    this.routeParam.models = this.models
    this.routeParam.replicaModels = this.replicaModels
    this.koaApp.context.sequelize = db.instance
    this.koaApp.context.models = this.models

    // 🔄 Attendre que PostgreSQL soit prêt (évite crash au boot sur toutes les instances)
    await this.waitForPostgres(db.instance)

    // 🔑 Sessions
    this.koaApp.keys = ['oldsdfsdfsder secdsfsdfsdfret key']
    this.koaApp.proxy = true

    process.on('uncaughtException', (err) => {
      console.error('🛑 Uncaught Exception:', err)
    })

    process.on('unhandledRejection', (reason, promise) => {
      console.error('🛑 Unhandled Rejection at:', promise, 'reason:', reason)
    })

    // 🧠 Migration + seed uniquement sur l’instance principale
    if (isPrimaryInstance) {
      await db.migrations()
      await db.seeders()

      // ⏰ Démarrage des crons + warmup
      startCrons(this)
      console.log('--- IS READY ---', config.port)
      this.isReady()

      // ⏳ Warmup redis différé pour éviter timeout Scalingo
      setTimeout(() => {
        this.warmupRedisCache().catch((err) => {
          console.error('❌ Erreur warmup Redis (décalé) :', err)
        })
      }, 1000)
    } else {
      console.log('--- IS READY ---', config.port)
      this.isReady()
    }

    // 🔒 Limiteur de requêtes
    const limiter = RateLimit.middleware({
      interval: { min: 5 },
      max: config.maxQueryLimit,
    })

    // 🧊 Sessions Redis
    const sessionConfig = { ...config.session }
    if (config.redis) {
      const redisUrlSplited = config.redis.split('@')
      const redisConfig = {}
      if (redisUrlSplited.length > 1) {
        const redisUrl = redisUrlSplited[1].split(':')
        const redisAccount = redisUrlSplited[0].split(':')
        redisConfig.host = redisUrl[0]
        redisConfig.port = redisUrl[1]
        redisConfig.password = redisAccount[redisAccount.length - 1]
      } else {
        const redisUrl = redisUrlSplited[0].split(':')
        redisConfig.host = redisUrl[1].replace('//', '')
        redisConfig.port = redisUrl[2]
      }
      sessionConfig.store = new RedisStore(redisConfig)
    }

    this.koaApp.use(session(sessionConfig, this.koaApp))
    Sentry.setupKoaErrorHandler(this.koaApp)

    // 🧱 Middlewares principaux
    super.addMiddlewares([
      limiter,
      koaBody({ multipart: true, formLimit: '512mb', textLimit: '512mb', jsonLimit: '512mb' }),
      i18n(this.koaApp, {
        directory: join(__dirname, 'locales'),
        extension: '.json',
        locales: ['en', 'fr'],
        modes: ['query', 'subdomain', 'cookie', 'header', 'tld'],
      }),
      auth,
      sslMiddleware,
      logger(),
      addDefaultBody(),
      compress({}),
      givePassword,
      helmet(cspConfig),
      async (ctx, next) => {
        ctx.set('x-xss-protection', '1')
        if (CSP_URL_IGNORE_RULES.find((u) => ctx.url.startsWith(u))) {
          ctx.set('content-security-policy', '')
        }
        await next()
      },
      async (ctx, next) => {
        if (ctx.url.includes('/ap-bo/') && basicAuth) {
          await basicAuth.check((req, res, err) => {
            if (err) throw err
            else next()
          })(ctx.req, ctx.res)
        } else {
          await next()
        }
      },
    ])

    // 🧩 CORS
    if (config.corsUrl) {
      super.addMiddlewares([cors({ origin: config.corsUrl, credentials: true })])
    } else {
      super.addMiddlewares([cors({ credentials: true })])
    }

    // 🔌 Montages de routes
    super.mountFolder(join(__dirname, 'routes-logs'), '/logs/')
    super.mountFolder(join(__dirname, 'routes-api'), '/api/')
    super.mountFolder(join(__dirname, 'routes-admin'), '/ap-bo/')
    super.mountFolder(join(__dirname, 'routes-docker'), '/docker/')
    super.mountFolder(join(__dirname, 'routes'), '/')

    return super.start()
  }

  isReady() {}

  done() {
    console.log('--- DONE ---')
    process.exit()
  }

  async warmupRedisCache(force = false) {
    await waitForRedis()
    const redis = getRedisClient()

    if (!redis?.isReady) {
      console.warn('⚠️ Redis non prêt, warmup ignoré.')
      return
    }

    const lockKey = 'warmup-redis-lock'
    const lockTTL = 300 // en secondes
    const lockId = `${Date.now()}-${Math.random()}`
    let hasLock = false

    try {
      const lockSet = await redis.set(lockKey, lockId, { NX: true, EX: lockTTL })
      if (!lockSet) {
        const currentLock = await redis.get(lockKey)
        console.log(`⛔️ Warmup déjà en cours, on skip. Lock actuel : ${currentLock}`)
        return
      }

      hasLock = true
      console.log(`🚀 Début du warmupRedisCache @ ${new Date().toISOString()} (force=${force})`)
      console.time('warmupRedisCache')

      const jurisdictions = await this.models.HumanResources.getAllJuridictionsWithSizes()
      const maxAtOnce = 5

      const chunks = Array.from({ length: Math.ceil(jurisdictions.length / maxAtOnce) }, (_, i) => jurisdictions.slice(i * maxAtOnce, (i + 1) * maxAtOnce))

      for (const chunk of chunks) {
        console.log(process.memoryUsage())

        const ids = chunk.map((j) => j.id)
        console.log(`🧊 Warmup batch : [${ids.join(', ')}]`)

        const results = await Promise.allSettled(
          ids.map(async (jurId) => {
            try {
              const fullKey = getFullKey('hrBackup', jurId)

              if (force) {
                await redis.del(fullKey)
                if (process.env.NODE_ENV !== 'production') {
                  console.log(`🧹 Cache supprimé pour ${fullKey}`)
                }
              }

              const hr = await loadOrWarmHR(jurId, this.models)
              if (!hr || typeof hr !== 'object') {
                console.warn(`⚠️ Donnée HR vide ou invalide pour ${jurId}, skip setCache`)
                return
              }
            } catch (err) {
              console.error(`❌ Juridiction ${jurId} échouée`, err)
              throw err
            }
          }),
        )

        const failures = results.filter((r) => r.status === 'rejected')
        if (failures.length > 0) {
          console.warn(`⚠️ ${failures.length} juridiction(s) échouée(s) dans ce batch.`)
        }
      }

      console.timeEnd('warmupRedisCache')
      console.log('✅ Warmup Redis terminé')
    } catch (err) {
      console.error('❌ Erreur warmupRedisCache:', err)
    } finally {
      if (hasLock) {
        try {
          const currentLock = await redis.get(lockKey)
          if (!currentLock) {
            console.warn('⚠️ Aucun lock trouvé — il a probablement expiré avant la fin du warmup.')
          } else if (currentLock === lockId) {
            await redis.del(lockKey)
            console.log('🔓 Lock Redis libéré proprement.')
          } else {
            console.warn(`⚠️ Lock détenu par une autre instance : ${currentLock}`)
          }
        } catch (err) {
          console.error('❌ Erreur lors de la tentative de libération du lock Redis :', err)
        }
      }
    }
  }

  waitForPostgres = async (sequelizeInstance, maxRetries = 10, delayMs = 2000) => {
    let attempt = 0

    while (attempt < maxRetries) {
      try {
        await sequelizeInstance.authenticate()
        console.log('✅ PostgreSQL est prêt')
        return
      } catch (err) {
        attempt++
        console.warn(`⏳ Tentative ${attempt}/${maxRetries} : PostgreSQL non prêt (${err.message})`)
        await new Promise((resolve) => setTimeout(resolve, delayMs))
      }
    }

    throw new Error(`❌ PostgreSQL inaccessible après ${maxRetries} tentatives`)
  }
}
