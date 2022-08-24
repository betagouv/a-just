import Route, { Access } from './Route'
import { Types } from '../utils/types'
import { USER_REMOVE_HR } from '../constants/log-codes'
import { preformatHumanResources } from '../utils/ventilator'
import { getCategoryColor } from '../constants/categories'
import { sumBy } from 'lodash'
import { emptyCalulatorValues } from '../constants/calculator'

export default class RouteCalculator extends Route {
  constructor (params) {
    super({ ...params, model: 'HumanResources' })
  }

  @Route.Post({
    bodyType: Types.object().keys({
      backupId: Types.number().required(),
      dateStart: Types.date().required(),
      dateStop: Types.date().required(),
      contentieuxIds: Types.array().required(),
      optionBackupId: Types.number().required(),
    }),
    accesses: [Access.canVewHR],
  })
  async filterList (ctx) {
    let { backupId, dateStart, dateStop, contentieuxIds, optionBackupId } = this.body(ctx)

    if(!await this.models.HRBackups.haveAccess(backupId, ctx.state.user.id)) {
      ctx.throw(401, 'Vous n\'avez pas accès à cette juridiction !')
    }

    const list = emptyCalulatorValues(await this.models.ContentieuxReferentiels.getReferentiels())

    this.sendOk(ctx, list)
  }
}
