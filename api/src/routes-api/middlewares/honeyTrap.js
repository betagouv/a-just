import { HONEY_IP_BLOCK_AGAIN, HONEY_IP_TRAPPED } from '../../constants/log-codes'

const TRAPS = [
  'api/sn',
  'api/st',
  'api/ip',
  'api/b',
  '.asp',
  '.axd',
  '/api/cu',
  '/api/cu',
  '/api/ti',
  '/api/l',
  '/api/su',
  '/api/to',
  '/api/tr',
  '/api/m',
  '/api/v',
  '/testing',
  '.ashx',
  '.aspx',
  'api/user/current',
  'api/w',
  'api/se',
  'api/p',
  'PreAuth',
  '.file',
  'menus',
  'mail',
  'server_status',
  'whoami',
  'apis',
  'defaultroot',
  'eam/vib',
  '9pkocu_riddle',
  '9pkocu=riddle',
  '.php',
  'mobile',
  'wp-json',
  'graphql',
  'v2',
  '.yml',
  '.yaml',
  'swagger.json',
  'openapi',
  'storefront',
  'query',
  'T /v1',
  'T /admin',
  'secure',
  'api/v1',
  'api/v4',
  'swagger',
  '.cgi',
  'hello',
  'quotas',
  'jdbc',
  'portal',
  'src',
  '.jsp',
  'jolokia',
  'batch',
  'ping',
  'oewnselinqro',
  'rest',
  'jsonapi',
  '.aws',
  'api/auth/',
  'api/auth 2',
  'api/g',
  'api/identity',
  'api/init',
  'api/call',
  'roundcube',
  '.zip',
  '.key',
  '.ssh',
  'jmx-console',
  '.data',
  'FileDownload',
  'wp-',
  'csp_report',
  'realms',
  '.bak',
  '.sql',
  '.PhP7',
  '.md',
  'api/ch',
  '.seam',
  '.svn',
  'riddle',
  '.git',
  'insights',
  'api/na',
  'api/no',
  'api/sav',
  'localhost',
  '/admin',
  '/api/ 200',
  'api/clients',
  '/ap 2',
  '/run 2',
  '/NmConsole 2',
  '/user 2',
  '/lic 2',
  '/overview 2',
  '/webui 2',
  '/app 2',
  'HTTP',
  '.avif',
  'META-INF',
  '.DS_Store',
  '.application',
  '.cfc',
  '.conf',
  '.zul',
  'nsversion',
  'Injection',
  '.gz',
  '/tmp',
  'www',
  '.1tmhl',
  '/bin/',
  '.action',
  '.cfm',
  '.rst',
  'passwd',
  '.vscode',
  'kibana',
]
const IP_TRAPPED = []

/**
 * Module de control des urls interdit
 */
export default async (ctx, next, models) => {
  //console.log('Client IP', ctx.request.ip, ctx.request.url)

  if (IP_TRAPPED.indexOf(ctx.request.ip) !== -1) {
    console.log('IP BLOCKED - ', ctx.request.ip)
    models.Logs.addLog(HONEY_IP_BLOCK_AGAIN, null, ctx.request.ip, { formatValue: false, datas2: ctx.request.url, logging: false })
    ctx.res.writeHead(403).end()
    return
  }

  if (
    ctx.request.url &&
    TRAPS.some((t) => {
      return ctx.request.url.includes(t)
    })
  ) {
    console.log('NEW IP BLOCKED - ', ctx.request.ip, ctx.request.url)
    IP_TRAPPED.push(ctx.request.ip)
    models.Logs.addLog(HONEY_IP_TRAPPED, null, ctx.request.ip, { formatValue: false, datas2: ctx.request.url, logging: false })
    ctx.res.writeHead(403).end()
    return
  }

  await next()
}

// /api/juridictions-details/get-cle
/*
console.log(
  'TRAP',
  TRAPS.filter((t) => {
    return '/api/juridictions-details/get-cle'.includes(t)
  })
)*/
