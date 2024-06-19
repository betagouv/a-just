import users from './cron-users'
import agents from './cron-agents'

export const start = (env) => {
  users(env)
  agents(env)
}
