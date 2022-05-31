import config from 'config'

module.exports = async function async (ctx, next) {
  const token = ctx.get('Authorization')
  const params = new URLSearchParams(ctx.req._parsedUrl.query)
  const password = params.get('pwd')
  if (ctx.request.url.startsWith('/logs/') && !(token === `Bearer ${config.logsPassword}` || password === config.logsPassword)) {
    ctx.throw(401, ctx.state.__('Accès non autorisé'))
  } else {
    return next()
  }
}