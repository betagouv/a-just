import { CronJob } from 'cron'

const agentCron = async (env) => {
  // check monday at 2 am
  const syncAllDaysAt6 = new CronJob('0 2 * * *', async function () {
    console.log('START CRONS : CHECK AGENT TO REMOVE')
    await env.models.HumanResources.checkAgentToAnonymise()
    await env.models.HumanResources.cleanEmptyAgent()
    console.log('END CRONS : CHECK AGENT TO REMOVE')
  })

  syncAllDaysAt6.start()
  await env.models.HumanResources.checkAgentToAnonymise()
  await env.models.HumanResources.cleanEmptyAgent()
}

export default agentCron
