import Route, { Access } from './Route'
import { Types } from '../utils/types'
import { emptyCalulatorValues, syncCalculatorDatas } from '../constants/calculator'
import { flatListOfContentieuxAndSousContentieux } from '../utils/extractor'
import { filterList} from './RouteHumanResources'
import { preformatHumanResources } from '../utils/ventilator'
export default class RouteExtractor extends Route {
  constructor (params) {
    super({ ...params, model: 'HumanResources' })
  }

@Route.Post({
    bodyType: Types.object().keys({
      backupId: Types.number().required(),
      dateStart: Types.date().required(),
      dateStop: Types.date().required(),
    }),
    accesses: [Access.canVewHR],
  })
  async filterList (ctx) {
    let { backupId, dateStart, dateStop, contentieuxIds, optionBackupId } = this.body(ctx)

    if(!await this.models.HRBackups.haveAccess(backupId, ctx.state.user.id)) {
      ctx.throw(401, 'Vous n\'avez pas accès à cette juridiction !')
    }

    console.time('extractor-1')
    const referentiels = (await this.models.ContentieuxReferentiels.getReferentiels())
    console.timeEnd('extractor-1')

    const flatReferentielsList = flatListOfContentieuxAndSousContentieux(referentiels)

    const preformatedAllHumanResource = preformatHumanResources(hr, date)

    const allHuman = (await getHumanRessourceList(        
        backupId,
        dateStart,
        flatReferentielsList.map((a) => a.id),
        [0, 1, 2],
        dateStop,
        true))

        console.log(allHuman)

            this.sendOk(ctx, allHumanst)

  }

}