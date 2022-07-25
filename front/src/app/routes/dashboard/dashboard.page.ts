import { Component, OnInit } from '@angular/core'
import { ExcelService } from 'src/app/services/excel/excel.service'

@Component({
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
})
export class DashboardPage {
  constructor(private excelService: ExcelService) {}
  dateStart: Date | null = null
  dateStop: Date | null = null
  today = new Date()
  classSelected = 'disabled'

  export() {
    this.excelService.exportExcel()
  }

  selectDate(dateType: string, value: any): void {
    if (dateType === 'start') {
      this.excelService.dateStart.next(value)
      this.dateStart = value
    }
    if (dateType === 'stop') {
      this.excelService.dateStop.next(value)
      this.dateStop = value
    }

    if (this.dateStart !== null && this.dateStop !== null)
      this.classSelected = ''
    else this.classSelected = 'disabled'
  }
}
