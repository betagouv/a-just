import Route, { Access } from './Route'
import { Types } from '../utils/types'

export default class RouteActivities extends Route {
  constructor (params) {
    super({ ...params, model: 'Activities' })
  }

  @Route.Post({
    bodyType: Types.object().keys({
      list: Types.any(),
      backupId: Types.number(),
      backupName: Types.string(),
      juridictionId: Types.number(),
    }),
    accesses: [Access.canVewActivities],
  })
  async saveBackup (ctx) {
    /*const { backupId, list, backupName, juridictionId } = this.body(ctx)

    // const newId = await this.model.models.ActivitiesBackups.saveBackup(list, backupId, backupName, juridictionId)

    this.sendOk(ctx, newId)*/
    this.sendOk(ctx, 'ok')
  }
}
