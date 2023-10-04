import config from 'config'

/**
 * Module d'export autour de l'utilisateur connecté
 */
export default async (ctx, next) => {
  if (config.forceSSL && (ctx.request.origin || '').startsWith('http://')) {
    ctx.res
      .writeHead(301, {
        Location: (ctx.request.origin || '').replace('http://', 'https://') + (ctx.request.url || ''),
      })
      .end()
  }

  await next()
}
