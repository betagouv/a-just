import { HONEY_IP_BLOCK_AGAIN, HONEY_IP_TRAPPED } from '../../constants/log-codes'
import config from 'config'

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
  'PreAuth',
  '.file',
  'menus',
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
  const ip = ctx.request.ip
  const url = ctx.request.url

  if (config.useAgent) {
    const useAgentSplited = (config.useAgent || '').toLowerCase().split(',')
    const headerUserAgent = ctx.header['user-agent']
    if (useAgentSplited.some((w) => (headerUserAgent || '').includes(w))) {
      await next()
      return
    }
  }

  //console.log('ip', ip, config.ipFilter.whitelist.some(w => ip.includes(w)))

  if (config.ipFilter.whitelist.some((w) => ip.includes(w))) {
    await next()
    return
  }

  //console.log('Client IP', ip, url)

  if (IP_TRAPPED.indexOf(ip) !== -1) {
    console.log('IP BLOCKED - ', ip)
    models.Logs.addLog(HONEY_IP_BLOCK_AGAIN, null, ip, { formatValue: false, datas2: url, logging: false })
    ctx.res.writeHead(403).end()
    return
  }

  if (
    url &&
    TRAPS.some((t) => {
      return url.includes(t)
    })
  ) {
    console.log('NEW IP BLOCKED - ', ip, url)
    IP_TRAPPED.push(ip)
    models.Logs.addLog(HONEY_IP_TRAPPED, null, ip, { formatValue: false, datas2: url, logging: false })
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
    return '/api/public/tmp/update-referentiel.json'.includes(t)
  })
)*/
