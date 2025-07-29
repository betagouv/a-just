import { CronJob } from 'cron'

const cacheCron = async (env) => {
  // CRON chaque dimanche à 23h59
  //  const warmupEachSundayNight = new CronJob('59 23 * * 0', async function () {
  //const warmupEvery5Minutes = new CronJob('*/5 * * * *', async function () {
  /** console.log('START CRON : WARMUP REDIS CACHE')
    try {
      await env.warmupRedisCache(true)
      console.log('END CRON : WARMUP REDIS CACHE')
    } catch (err) {
      console.error('ERROR CRON : WARMUP REDIS CACHE', err)
    }
  })
  warmupEvery5Minutes.start()
  //warmupEachSundayNight.start()

  // Optionnel : lancer une première exécution immédiate au démarrage
  //await env.warmupRedisCache({ force: true })
  */
}

export default cacheCron
