import Route, { Access } from './Route'
import { Types } from '../utils/types'

export default class RouteActivities extends Route {
  constructor (params) {
    super({ ...params, model: 'Activities' })
  }



  @Route.Post({
    bodyType: Types.object().keys({
      list: Types.any(),
      hrBackupId: Types.number(),
    }),
    accesses: [Access.canVewActivities],
  })
  async saveBackup (ctx) {
    const { hrBackupId, list } = this.body(ctx)
    await this.model.saveBackup(list, hrBackupId)
    this.sendOk(ctx, 'Ok')
  }

  @Route.Post({
    bodyType: Types.object().keys({
      contentieuxId: Types.number(),
      date: Types.date(),
      values: Types.any(),
      hrBackupId: Types.number(),
    }),
    accesses: [Access.canVewActivities],
  })
  async updateBy (ctx) {
    const { contentieuxId, date, values, hrBackupId } = this.body(ctx)
    await this.model.updateBy(contentieuxId, date, values, hrBackupId)
    this.sendOk(ctx, 'Ok')
  }

@Route.Get({
    path: '*',
  })
  async getAll (ctx) {
    this.sendOk(ctx, (req, res) => {
    let workbook = createTestWorkbook().then(()=>{
    workbook.write('workbook.xlsx', res);
    });
})
  }
}
