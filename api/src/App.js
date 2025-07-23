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
        "'sha256-ErSGQ5RkfdaGFyDT7yi/vnakQoxNloHzsJR8SRc4ISE='",
        "'sha256-7ZHILzwrPOtuEc8fFrW3q+2DMmiMh6VwC/wBhNbTuUY='",
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
        "'sha256-7ZHILzwrPOtuEc8fFrW3q+2DMmiMh6VwC/wBhNbTuUY='",
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
      'base-uri': ["'self'"],
      'form-action': ["'self'", '*.hsforms.com'],
      'upgrade-insecure-requests': [],
    },
    //reportOnly: true,
  },
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: true,
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

    process.on('exit', (code) => {
      console.error('PROCESS EXIT CODE:', code)
    })

    process.on('uncaughtException', (err) => {
      console.error('🛑 Uncaught Exception:', err)
    })

    process.on('unhandledRejection', (reason, promise) => {
      console.error('🛑 Unhandled Rejection at:', promise, 'reason:', reason)
    })

    process.on('SIGTERM', () => {
      console.log('⚠️ SIGTERM reçu, le container va s’arrêter')
    })
    process.on('SIGINT', () => {
      console.log('⚠️ SIGINT reçu, interruption')
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
      }, 10000)
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
    const lockTTL = process.env.NODE_ENV === 'production' ? 300 : 30 // TTL réduit en dev
    const lockId = `${Date.now()}-${Math.random()}`
    let hasLock = false

    try {
      if (force) {
        const deleted = await redis.del(lockKey)
        if (deleted) {
          console.warn('🧨 Lock supprimé manuellement (force=true)')
        }
      }

      const lockSet = await redis.set(lockKey, lockId, { NX: true, EX: lockTTL })
      if (!lockSet) {
        const currentLock = await redis.get(lockKey)
        const ttl = await redis.ttl(lockKey)
        console.log(`⛔️ Warmup déjà en cours, on skip. Lock actuel : ${currentLock} (expire dans ${ttl}s)`)
        return
      }

      hasLock = true
      console.log(`🚀 Début du warmupRedisCache @ ${new Date().toISOString()} (force=${force})`)
      console.time('warmupRedisCache')

      const jurisdictions = await this.models.HumanResources.getAllJuridictionsWithSizes()
      const maxAtOnce = 2

      let chunks = Array.from({ length: Math.ceil(jurisdictions.length / maxAtOnce) }, (_, i) => jurisdictions.slice(i * maxAtOnce, (i + 1) * maxAtOnce))

      chunks = chunks.slice(0, 2)

      for (const chunk of chunks) {
        await this.asyncForEach(chunk, async (jur) => {
          const jurId = jur.id
          try {
            const fullKey = getFullKey('hrBackup', jurId)

            if (force) {
              await redis.del(fullKey)
            }

            await loadOrWarmHR(jurId, this.models)
          } catch (err) {
            console.error(`❌ Juridiction ${jurId} échouée`, err)
          }
        })
        //const used = process.memoryUsage()
        //console.log('🧠 Heap used (MB):', Math.round(used.heapUsed / 1024 / 1024))
        await this.sleep(100) // petite pause entre les batchs
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
            const ttl = await redis.ttl(lockKey)
            console.warn(`⚠️ Aucun lock trouvé (TTL restant : ${ttl}) — il a expiré ou Redis a été déconnecté`)
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

  asyncForEach = async (array, fn) => {
    for (let i = 0; i < array.length; i++) {
      await fn(array[i], i)
    }
  }

  sleep = (ms) => new Promise((res) => setTimeout(res, ms))
}
