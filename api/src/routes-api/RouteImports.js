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
      backupName: Types.string().required(),
    }),
    accesses: [Access.isAdmin],
  })
  async importHr (ctx) {  
    const { backupName } = this.body(ctx)
    const arrayOfHR = await csvToArrayJson(readFileSync(ctx.request.files.file.path, 'utf8'), {
      delimiter: ',',
    })
    await this.model.importList(arrayOfHR, backupName)
    this.sendOk(ctx, 'OK')
  }

  @Route.Post({
    bodyType: Types.object().keys({
    }),
    accesses: [Access.isAdmin],
  })
  async importReferentiel (ctx) {
    console.log(ctx.request.files)
    const arrayOfHR = await csvToArrayJson(readFileSync(ctx.request.files.file.path, 'utf8'), {
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
    }),
    accesses: [Access.isAdmin],
  })
  async importActivities (ctx) {  
    const { backupId, backupName, juridictionId } = this.body(ctx)

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

    const arrayOfHR = await csvToArrayJson(readFileSync(ctx.request.files.file.path, 'utf8'), {
      delimiter: ',',
    })
    await this.model.models.Activities.importList(arrayOfHR, juridictionId, backupId, backupName)
    this.sendOk(ctx, 'OK')
  }
}
