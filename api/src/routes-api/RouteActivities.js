import Route, { Access } from './Route'
import { Types } from '../utils/types'

export default class RouteActivities extends Route {
  constructor (params) {
    super({ ...params, model: 'Activities' })

    // this.cleanDatas() TO TEST
  }

  async cleanDatas () {
    const backups = await this.models.HRBackups.getAll()
    
    for(let i = 0; i < backups.length; i++) {
      await this.models.Activities.removeDuplicateDatas(backups[i].id)
      await this.models.Activities.cleanActivities(backups[i].id)
    }
  }

  @Route.Post({
    bodyType: Types.object().keys({
      contentieuxId: Types.number(),
      date: Types.date(),
      values: Types.any(),
      hrBackupId: Types.number(),
      nodeUpdated: Types.string(),
    }),
    accesses: [Access.canVewActivities],
  })
  async updateBy (ctx) {
    const { contentieuxId, date, values, hrBackupId, nodeUpdated } = this.body(ctx)
    await this.model.updateBy(contentieuxId, date, values, hrBackupId, ctx.state.user.id, nodeUpdated)
    this.sendOk(ctx, 'Ok')
  }

  @Route.Post({
    bodyType: Types.object().keys({
      date: Types.date(),
      hrBackupId: Types.number(),
    }),
    accesses: [Access.canVewActivities],
  })
  async getByMonth (ctx) {
    const { date, hrBackupId } = this.body(ctx)

    if(await this.models.HRBackups.haveAccess(hrBackupId, ctx.state.user.id)) {
      const list = await this.model.getByMonth(date, hrBackupId)
      this.sendOk(ctx, {
        list,
        lastUpdate: await this.models.HistoriesActivitiesUpdate.getLastUpdate(list.map(i => i.id)),
      })
    } else {
      this.sendOk(ctx, null)
    }
  }

  @Route.Post({
    bodyType: Types.object().keys({
      hrBackupId: Types.number(),
    }),
    accesses: [Access.canVewActivities],
  })
  async getLastMonth (ctx) {
    const { hrBackupId } = this.body(ctx)

    if(await this.models.HRBackups.haveAccess(hrBackupId, ctx.state.user.id)) {
      const date = await this.model.getLastMonth(hrBackupId)
      this.sendOk(ctx, {
        date,
      })
    } else {
      this.sendOk(ctx, null)
    }
  }

  @Route.Post({
    bodyType: Types.object().keys({
      hrBackupId: Types.number(),
    }),
    accesses: [Access.canVewActivities],
  })
  async loadAllActivities (ctx) {
    const { hrBackupId } = this.body(ctx)

    if(await this.models.HRBackups.haveAccess(hrBackupId, ctx.state.user.id)) {
      const list = await this.model.getAll(hrBackupId)
      this.sendOk(ctx, list)
    } else {
      this.sendOk(ctx, null)
    }
  }

  /*
@Route.Get({
  path: '*',
})
  async getAll (ctx) {
    this.sendOk(ctx, (req, res) => {
      let workbook = createTestWorkbook().then(()=>{
        workbook.write('workbook.xlsx', res)
      })
    })
  }*/
}
