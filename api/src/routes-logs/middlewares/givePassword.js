import config from 'config'

module.exports = async function async (ctx, next) {
  const token = ctx.get('Authorization')
  if (ctx.request.url.startsWith('/logs/') && token !== `Bearer ${config.logsPassword}`) {
    console.log('token', token)
    ctx.throw(401, ctx.state.__('Accès non autorisé'))
  } else {
    return next()
  }
}