import Route, { Access } from './Route'
import { Types } from '../utils/types'
import { emptyCalulatorValues, syncCalculatorDatas } from '../constants/calculator'
import { getNbMonth } from '../utils/date'

export default class RouteExtractor extends Route {
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

        if(!await this.models.HRBackups.haveAccess(backupId, ctx.state.user.id)) {
      ctx.throw(401, 'Vous n\'avez pas accès à cette juridiction !')
    }

        console.time('extractor-1')

            console.timeEnd('extractor-1')



}