import { CronJob } from 'cron'

const agentCron = async (env) => {
  // check monday at 4 pm
  const syncAllDaysAt6 = new CronJob('0 6 * * *', async function () {
    console.log('START CRONS : CHECK AGENT TO REMOVE')
    //await env.models.HumanResources.checkAgentToAnonymise()
    console.log('END CRONS : CHECK AGENT TO REMOVE')
  })

  syncAllDaysAt6.start()
  //await env.models.HumanResources.checkAgentToAnonymise()
}

export default agentCron
