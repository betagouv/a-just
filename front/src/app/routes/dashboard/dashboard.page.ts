import { AfterViewInit, Component, OnInit } from '@angular/core'
import { MainClass } from 'src/app/libs/main-class'
import { ExcelService } from 'src/app/services/excel/excel.service'

@Component({
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
})
export class DashboardPage extends MainClass implements AfterViewInit {
  ngAfterViewInit(): void {
    this.watch(
      this.excelService.loading.subscribe((value: boolean) => {
        if (value === true) {
          ;(
            document.getElementsByTagName('aj-wrapper')[0] as HTMLElement
          ).style.cursor = 'wait'

          document.getElementById('export-excel-button')!.style.cursor = 'wait'
        } else {
          ;(
            document.getElementsByTagName('aj-wrapper')[0] as HTMLElement
          ).style.cursor = 'auto'

          document.getElementById('export-excel-button')!.style.cursor =
            'pointer'
        }
      })
    )
  }
  constructor(private excelService: ExcelService) {
    super()
  }
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
