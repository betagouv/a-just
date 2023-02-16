import { CronJob } from 'cron'

const userCron = async (env) => {
  // check monday at 4 pm
  const syncOne = new CronJob('0 10 * * 1', async function () {
    console.log('START CRONS : CHECK LAST CONNEXION')
    await env.models.Users.checkLastConnexion()
    console.log('END CRONS : CHECK LAST CONNEXION')
  })

  syncOne.start()
}

export default userCron
