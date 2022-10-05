import { Injectable, OnInit } from '@angular/core'
import { HumanResourceService } from '../human-resource/human-resource.service'
import { HRCategoryService } from '../hr-category/hr-category.service'
import { HRCategoryInterface } from 'src/app/interfaces/hr-category'
import { generalizeTimeZone, month, workingDay } from 'src/app/utils/dates'
import { HumanResourceInterface } from 'src/app/interfaces/human-resource-interface'
import { ContentieuReferentielInterface } from 'src/app/interfaces/contentieu-referentiel'
import { BehaviorSubject } from 'rxjs'
import { MainClass } from 'src/app/libs/main-class'
import { HRFonctionService } from '../hr-fonction/hr-function.service'
import { HRFonctionInterface } from 'src/app/interfaces/hr-fonction'
import { ReferentielService } from '../referentiel/referentiel.service'
import { sumBy } from 'lodash'
import { UserService } from '../user/user.service'
import * as FileSaver from 'file-saver'
import { ServerService } from '../http-server/server.service'
import { AppService } from '../app/app.service'

const startCurrentSituation = month(new Date(), -12)
const endCurrentSituation = month(new Date(), -1, 'lastday')
const EXCEL_TYPE =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8'
const EXCEL_EXTENSION = '.xlsx'

@Injectable({
  providedIn: 'root',
})
export class ExcelService extends MainClass implements OnInit {
  categories: HRCategoryInterface[] = []
  fonctions: HRFonctionInterface[] = []
  allReferentiels: ContentieuReferentielInterface[] = []
  dateStart: BehaviorSubject<Date> = new BehaviorSubject<Date>(
    startCurrentSituation
  )
  dateStop: BehaviorSubject<Date> = new BehaviorSubject<Date>(
    endCurrentSituation
  )
  selectedCategory: BehaviorSubject<string> = new BehaviorSubject<string>('')
  data: Array<any> = []
  columnSize: Array<any> = []

  constructor(
    private humanResourceService: HumanResourceService,
    private serverService: ServerService,
    private userService: UserService,
    private appService: AppService
  ) {
    super()

    this.watch(this.dateStart.subscribe((value) => {}))

    this.watch(this.dateStop.subscribe((value) => {}))
  }

  ngOnInit(): void {}

  exportExcel() {
    return this.serverService
      .post(`extractor/filter-list`, {
        backupId: this.humanResourceService.backupId.getValue(),
        dateStart: generalizeTimeZone(this.dateStart.getValue()),
        dateStop: generalizeTimeZone(this.dateStop.getValue()),
        categoryFilter: this.selectedCategory.getValue(),
      })
      .then((data) => {
        console.log(data.data.values)
        this.data = data.data.values
        this.columnSize = data.data.columnSize
        import('xlsx').then((xlsx) => {
          const worksheet = xlsx.utils.json_to_sheet(this.data, {})
          const workbook = {
            Sheets: { data: worksheet },
            SheetNames: ['data'],
          }

          worksheet['!cols'] = this.columnSize

          const excelBuffer: any = xlsx.write(workbook, {
            bookType: 'xlsx',
            type: 'array',
          })

          const filename = this.getFileName()
          const data: Blob = new Blob([excelBuffer], { type: EXCEL_TYPE })
          this.appService.alert.next({
            text: "Le téléchargement va démarrer : cette opération peut, selon votre ordinateur, prendre plusieurs secondes. Merci de patienter jusqu'à l'ouverture de votre fenêtre de téléchargement",
          })
          FileSaver.saveAs(data, filename + EXCEL_EXTENSION)
        })
      })
  }

  getFileName() {
    return `Extraction-${
      this.userService.user.getValue()!.firstName
    }_${this.userService.user.getValue()!.lastName!}_fait le ${new Date()
      .toJSON()
      .slice(0, 10)}_du ${new Date(
      this.dateStart
        .getValue()
        .setMinutes(
          this.dateStart.getValue().getMinutes() -
            this.dateStart.getValue().getTimezoneOffset()
        )
    )
      .toJSON()
      .slice(0, 10)} au ${new Date(
      this.dateStop
        .getValue()
        .setMinutes(
          this.dateStop.getValue().getMinutes() -
            this.dateStop.getValue().getTimezoneOffset()
        )
    )
      .toJSON()
      .slice(0, 10)}`
  }
}
