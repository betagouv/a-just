import Route, { Access } from './Route'
import { Types } from '../utils/types'

export default class RouteActivities extends Route {
  constructor (params) {
    super({ ...params, model: 'Activities' })
  }

   excel = require("excel4node");

 async createTestWorkbook() {
    const workbook = new excel.Workbook();
    const style = workbook.createStyle({
        font: { color: "#0101FF", size: 11 }
    });

    const worksheet = workbook.addWorksheet("Sheet 1");

    const arrayToWrite = Array.from({length: 10}, (v, k) => [`Row ${k+1}, Col 1`,`Row ${k+1}, Col 2`]);
    arrayToWrite.forEach((row, rowIndex) => {
        row.forEach((entry, colIndex) => { 
            worksheet.cell(rowIndex + 1, colIndex + 1).string(entry).style(style); 
        })
    })

    return workbook;
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
