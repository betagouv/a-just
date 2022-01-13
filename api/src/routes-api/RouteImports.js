import Route, { Access } from './Route'
import { Types } from '../utils/types'
import { csvToArrayJson } from '../utils/csv'
import { readFileSync } from 'fs'

export default class RouteImports extends Route {
  constructor (params) {
    super({ ...params, model: 'HumanResources' })
  }

  @Route.Post({
    bodyType: Types.object().keys({
      backupName: Types.string(),
      backupId: Types.number(),
      file: Types.string(),
    }),
    accesses: [Access.isAdmin],
  })
  async importHr (ctx) {  
    const { backupName, backupId, file } = this.body(ctx)
    const arrayOfHR = await csvToArrayJson(file ? file : readFileSync(ctx.request.files.file.path, 'utf8'), {
      delimiter: ',',
    })
    await this.model.importList(arrayOfHR, backupName, backupId)
    this.sendOk(ctx, 'OK')
  }

  @Route.Post({
    bodyType: Types.object().keys({
      file: Types.string(),
    }),
    accesses: [Access.isAdmin],
  })
  async importReferentiel (ctx) {
    const { file } = this.body(ctx)
    const arrayOfHR = await csvToArrayJson(file ? file : readFileSync(ctx.request.files.file.path, 'utf8'), {
      delimiter: ';',
    })
    await this.model.models.ContentieuxReferentiels.importList(arrayOfHR)
    this.sendOk(ctx, 'OK')
  }

  @Route.Post({
    bodyType: Types.object().keys({
      backupId: Types.number(),
      backupName: Types.string(),
      juridictionId: Types.number().required(),
      file: Types.string(),
    }),
    accesses: [Access.isAdmin],
  })
  async importActivities (ctx) { 
    ctx.request.socket.setTimeout(5 * 60 * 1000) // change timeout to 5 minutes
    const { backupId, backupName, juridictionId, file } = this.body(ctx)

    if(!backupId && !backupName) {
      ctx.throw(401, ctx.state.__('Vous devez saisir au moins un backupId ou backupName !'))
    }

    if(backupId && backupName) {
      ctx.throw(401, ctx.state.__('Vous devez saisir un seul backupId ou backupName !'))
    }

    const jurdicition = await this.model.models.Juridictions.findOne({
      where: {
        id: juridictionId,
      },
    })
    if(!jurdicition) {
      ctx.throw(401, ctx.state.__('La juridiction n\'existe pas !'))
    }

    const arrayOfHR = await csvToArrayJson(file ? file : readFileSync(ctx.request.files.file.path, 'utf8'), {
      delimiter: ',',
    })
    await this.model.models.Activities.importList(arrayOfHR, juridictionId, backupId, backupName)
    this.sendOk(ctx, 'OK')
  }
}
