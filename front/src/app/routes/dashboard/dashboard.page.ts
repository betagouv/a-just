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
  categories = [
    { id: 1, value: 'Tous' },
    { id: 2, value: 'Magistrat' },
    { id: 3, value: 'Contractuel' },
    { id: 4, value: 'Fonctionnaire' },
  ]
  selectedCategorieId: undefined | string = undefined

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
    this.checkValidity()
  }

  updateCategory(event: any) {
    const category = this.categories.find(
      (category) => category.id === event[0]
    )
    this.selectedCategorieId = category?.value
    if (this.selectedCategorieId) {
      this.excelService.selectedCategory.next(
        this.selectedCategorieId.toLowerCase()
      )
      this.checkValidity()
    }
  }

  checkValidity() {
    if (
      this.dateStart !== null &&
      this.dateStop !== null &&
      this.selectedCategorieId !== undefined
    )
      this.classSelected = ''
    else this.classSelected = 'disabled'
  }
}
