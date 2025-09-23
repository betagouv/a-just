import 'dotenv/config' // ✅ Correct

module.exports = {
  isDev: true,
  envName: 'DEV',
  displayEnvName: '[DEV] ',
  logsPassword: 'FXM',
  nbMaxDayCanBeInactive: null,
  sentEmail: false,
  maxQueryLimit: 10000000,
  login: {
    shareAuthCode: true,
    enable2Auth: true,
    max2AuthByMonth: 1,
  },
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
