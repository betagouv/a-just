import users from './cron-users'

export const start = (env) => {
  users(env)
}
