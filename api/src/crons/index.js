import users from './cron-users'
import agents from './cron-agents'
import cacheCron from './cran-cache'

export const start = (env) => {
  users(env)
  agents(env)
  //cacheCron(env)
}
