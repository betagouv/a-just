import Route, { Access } from './Route'
import { Types } from '../utils/types'
import { USER_REMOVE_HR } from '../constants/log-codes'
import { preformatHumanResources } from '../utils/ventilator'
import { getCategoryColor } from '../constants/categories'
import { sumBy } from 'lodash'
import { emptyCalulatorValues, syncCalculatorDatas } from '../constants/calculator'
import { getNbMonth } from '../utils/date'

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

    const referentiels = await this.models.ContentieuxReferentiels.getReferentiels()
    const optionsBackups = await this.models.ContentieuxOptions.getAllById(optionBackupId)
    let list = emptyCalulatorValues(referentiels)
    const nbMonth = getNbMonth(dateStart, dateStop)
    const categories = await this.models.HRCategories.getAll()
    const hr = await this.model.getCache(backupId)
    list = syncCalculatorDatas(list, nbMonth, await this.models.Activities.getAll(backupId), dateStart, dateStop, hr, categories, optionsBackups)
    
    this.sendOk(ctx, list)
  }
}
