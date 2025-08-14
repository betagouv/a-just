import { CronJob } from 'cron'

const agentCron = async (env) => {
  // check monday at 2 am
  const syncAllDaysAt6 = new CronJob('0 2 * * *', async function () {
    console.log('START CRONS : CHECK AGENT TO REMOVE')
    await env.models.HumanResources.checkAgentToAnonymise()
    await env.models.HumanResources.cleanEmptyAgent()
    console.log('END CRONS : CHECK AGENT TO REMOVE')
    try {
      await env.warmupRedisCache(true)
      console.log('END CRON : WARMUP REDIS CACHE')
    } catch (err) {
      console.error('ERROR CRON : WARMUP REDIS CACHE', err)
    }
  })

  syncAllDaysAt6.start()
  await env.models.HumanResources.checkAgentToAnonymise()
  await env.models.HumanResources.cleanEmptyAgent()
  try {
    await env.warmupRedisCache(true)
    console.log('END CRON : WARMUP REDIS CACHE')
  } catch (err) {
    console.error('ERROR CRON : WARMUP REDIS CACHE', err)
  }
}

export default agentCron
