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

  // A supprimer après mise à jour
  @Route.Post({
    bodyType: Types.object().keys({
      file: Types.string(),
    }),
    accesses: [Access.isAdmin],
  })
  async formatCodeReferentiel (ctx) {
    const { file } = this.body(ctx)
    const arrayOfHR = await csvToArrayJson(file ? file : readFileSync(ctx.request.files.file.path, 'utf8'), {
      delimiter: ';',
    })
    await this.model.models.ContentieuxReferentiels.formatReferentielWithCode(arrayOfHR)
    this.sendOk(ctx, 'OK')
  }

  @Route.Post({
    bodyType: Types.object().keys({
      backupId: Types.number(),
      file: Types.string(),
    }),
    accesses: [Access.isAdmin],
  })
  async importActivities (ctx) { 
    const { backupId, file } = this.body(ctx)

    const arrayOfHR = await csvToArrayJson(file ? file : readFileSync(ctx.request.files.file.path, 'utf8'), {
      delimiter: ',',
    })
    this.model.models.Activities.importList(arrayOfHR, backupId) // let continue alone
    this.sendOk(ctx, 'OK')
  }
}
