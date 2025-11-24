module.exports = {
  envName: '[TEST] ',
  preLoad: false,
  redis: process.env.REDIS_URL,
  login: {
    shareAuthCode: true,
    enable2Auth: false,
    max2AuthByMonth: 1,
  },
  /**
   * Url du cors
   */
  corsUrl: null,
  /**
   * Path de la base
   */
  database: {
    url: process.env.DATABASE_URL,
    logging: false,
  },
  sentEmail: false,
  session: {
    key: 'koa.sess' /** (string) cookie key (default is koa.sess) */,
    /** (number || 'session') maxAge in ms (default is 1 days) */
    /** 'session' will result in a cookie that expires when session/browser is closed */
    /** Warning: If a session cookie is stolen, this cookie will never expire */
    maxAge: 86400000,
    autoCommit: true /** (boolean) automatically commit headers (default true) */,
    overwrite: true /** (boolean) can overwrite or not (default true) */,
    httpOnly: true /** (boolean) httpOnly or not (default true) */,
    signed: true /** (boolean) signed or not (default true) */,
    rolling: false,
    renew: false /** (boolean) renew session when session is nearly expired, so we can always keep user logged in. (default is false)*/,
    secure: false /** (boolean) secure cookie*/,
    sameSite: null /** (string) session cookie sameSite options (default null, don't set it) */,
  },
}
