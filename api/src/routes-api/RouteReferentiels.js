import { orderBy } from 'lodash'
import { referentielMappingIndex } from '../utils/referentiel'
import Route, { Access } from './Route'

export default class RouteReferentiels extends Route {
  constructor (params) {
    super({ ...params, model: 'ContentieuxReferentiels' })
  }

  @Route.Get({
    accesses: [Access.isLogin],
  })
  async getReferentiels (ctx) {
    const mainList = await this.model.getReferentiels()
    let list = []
    mainList.map((main) => {
      if (main.childrens) {
        main.childrens.map((subMain) => {
          if (subMain.childrens) {
            list = list.concat(subMain.childrens)
          }
        })
      }
    })

    // force to order list
    list = orderBy(
      list.map((r) => {
        r.rank = referentielMappingIndex(r.label)
        return r
      }),
      ['rank']
    )

    this.sendOk(ctx, list)
  }
}
