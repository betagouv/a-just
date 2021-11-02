import Route/*, { Access }*/ from './Route'
import { Types } from '../utils/types'
import { csvToArrayJson } from '../utils/csv'
import { readFileSync } from 'fs'

export default class RouteImports extends Route {
  constructor (params) {
    super({ ...params, model: 'HumanResources' })
  }

  @Route.Post({
    bodyType: Types.object().keys({
      // file: Types.file(),
    }),
    // accesses: [Access.isLogin],
  })
  async importHr (ctx) {
    const arrayOfHR = await csvToArrayJson(readFileSync(ctx.request.files.file.path, 'utf8'), {
      delimiter: ',',
    })
    await this.model.importList(arrayOfHR)
    this.sendOk(ctx, 'OK')
  }
}
