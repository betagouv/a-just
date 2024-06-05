import { CronJob } from 'cron'

const userCron = async (env) => {
  // check monday at 4 pm
  const syncAllDaysAt6 = new CronJob('0 6 * * *', async function () {
    console.log('START CRONS : CHECK REMOVED ACCOUNT')
    //await env.models.Users.checkAccountToRemove()
    console.log('END CRONS : CHECK REMOVED ACCOUNT')
  })

  syncAllDaysAt6.start()

  //await env.models.Users.checkAccountToRemove()
}

export default userCron
