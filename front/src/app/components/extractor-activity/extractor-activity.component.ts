import { Component, OnInit } from '@angular/core'
import FileSaver from 'file-saver'
import { orderBy } from 'lodash'
import { BehaviorSubject } from 'rxjs'
import { ActivityInterface } from 'src/app/interfaces/activity'
import { ContentieuReferentielInterface } from 'src/app/interfaces/contentieu-referentiel'
import { HRCategoryInterface } from 'src/app/interfaces/hr-category'
import { MainClass } from 'src/app/libs/main-class'
import { ActivitiesService } from 'src/app/services/activities/activities.service'
import { AppService } from 'src/app/services/app/app.service'
import { ExcelService } from 'src/app/services/excel/excel.service'
import { ServerService } from 'src/app/services/http-server/server.service'
import { HumanResourceService } from 'src/app/services/human-resource/human-resource.service'
import { UserService } from 'src/app/services/user/user.service'
import {
  generalizeTimeZone,
  getLongMonthString,
  getShortMonthString,
} from 'src/app/utils/dates'
import {
  userCanViewContractuel,
  userCanViewGreffier,
  userCanViewMagistrat,
} from 'src/app/utils/user'

/**
 * Excel file details
 */
const EXCEL_TYPE =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8'
/**
 * Excel file extension
 */
const EXCEL_EXTENSION = '.xlsx'

@Component({
  selector: 'aj-extractor-activity',
  templateUrl: './extractor-activity.component.html',
  styleUrls: ['./extractor-activity.component.scss'],
})
export class ExtractorActivityComponent extends MainClass implements OnInit {
  /**
   * Date de début selectionnée
   */
  dateStart: Date | null = null
  /**
   * Date de fin selectionnée
   */
  dateStop: Date | null = null
  /**
   * Date à aujourd'hui
   */
  today = new Date()
  /**
   * Activation selection
   */
  classSelected = 'disabled'
  /**
   * Categories
   */
  categories = new Array<any>()
  /**
   * Categorie selectionée
   */
  selectedCategorieId: undefined | string = undefined
  /**
   * Loader
   */
  isLoading: boolean = false
  /**
   * Date de dernier data uploaded
   */
  lastDataDate: Date | null = null
  /**
   * Peux voir l'interface magistrat
   */
  canViewMagistrat: boolean = false
  /**
   * Peux voir l'interface greffier
   */
  canViewGreffier: boolean = false
  /**
   * Peux voir l'interface contractuel
   */
  canViewContractuel: boolean = false
  /**
   * Données à extraire
   */
  data: any = undefined

  /**
   * Constructeur
   * @param humanResourceService
   * @param serverService
   * @param userService
   * @param appService
   */
  constructor(
    private humanResourceService: HumanResourceService,
    private serverService: ServerService,
    private excelService: ExcelService,
    private userService: UserService,
    private activityService: ActivitiesService,
    private appService: AppService
  ) {
    super()

    this.activityService.getLastMonthActivities().then((data) => {
      this.lastDataDate = new Date(data)
      console.log(this.lastDataDate)
    })

    this.watch(
      this.userService.user.subscribe((u) => {
        this.canViewMagistrat = userCanViewMagistrat(u)
        this.canViewGreffier = userCanViewGreffier(u)
        this.canViewContractuel = userCanViewContractuel(u)
        if (
          this.canViewMagistrat &&
          this.canViewGreffier &&
          this.canViewContractuel
        )
          this.categories.push({ id: 1, value: 'Tous' })
        if (this.canViewMagistrat)
          this.categories.push({ id: 2, value: 'Magistrat' })
        if (this.canViewContractuel)
          this.categories.push({ id: 3, value: 'Contractuel' })
        if (this.canViewGreffier)
          this.categories.push({ id: 4, value: 'Fonctionnaire' })
      })
    )
  }

  ngOnInit(): void {}

  /**
   * Selecteur de date
   * @param dateType date de début ou date de fin
   * @param value date
   */
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

  /**
   * Vérifie si tous les paramètres sont bien selectionnés
   */
  checkValidity() {
    if (this.dateStart !== null && this.dateStop !== null)
      this.classSelected = ''
    else this.classSelected = 'disabled'
  }

  /**
   * Get data from back-end
   * @returns
   */
  exportActDate() {
    return this.serverService
      .post(`extractor/filter-list-act`, {
        backupId: this.humanResourceService.backupId.getValue(),
        dateStart: generalizeTimeZone(this.dateStart || this.today),
        dateStop: generalizeTimeZone(this.dateStop || this.today),
      })
      .then((data) => {
        this.data = data.data.list
        const headers = [
          ' ',
          'Période',
          'Entrées logiciel',
          'Entrées A-JUSTées',
          'Sorties logiciel',
          'Sorties A-JUSTées',
          'Stock logiciel',
          'Stock A-JUSTé',
        ]
        let monthTabName = ''

        import('xlsx').then((xlsx) => {
          const workbook = xlsx.utils.book_new()

          this.data = Object.keys(this.data).map((key: any) => {
            this.data[key] = this.data[key].map((act: any) => {

              monthTabName =
                getShortMonthString(new Date(act.periode)) +
                ' ' +
                new Date(act.periode).getFullYear()
              return {
                [' ']:
                  act.contentieux.code_import + ' ' + act.contentieux.label,
                ['codeUnit']: Math.trunc(
                  Number(act.contentieux.code_import.slice(0, -1))
                ),
                ['codeCent']:
                  Number(act.contentieux.code_import.slice(0, -1)) % 1 * 10,
                Période: monthTabName,
                ['Entrées logiciel']: act.entrees,
                ['Entrées A-JUSTées']: act.originalEntrees,
                ['Sorties logiciel']: act.sorties,
                ['Sorties A-JUSTées']: act.originalSorties,
                ['Stock logiciel']: act.stock,
                ['Stock A-JUSTé']: act.originalStock,
              }
            })
            this.data[key] = orderBy(this.data[key], ['codeUnit','codeCent'],['asc'] )           
    
            this.data[key].forEach(function (v: any) {
              delete v['codeUnit']
              delete v['codeCent']
            })

            console.log(this.data[key])

            const worksheet = xlsx.utils.json_to_sheet(this.data[key], {})
            const max_width = headers.map((header) => {
              return {
                wch: Math.max(
                  header.length,
                  this.data[key].reduce(
                    (w: any, r: any) =>
                      Math.max(w || 10, (r[header] || []).length || 10),
                    10
                  )
                ),
              }
            })

            worksheet['!cols'] = max_width
            xlsx.utils.book_append_sheet(workbook, worksheet, monthTabName)
          })

          const excelBuffer: any = xlsx.write(workbook, {
            bookType: 'xlsx',
            type: 'array',
          })

          const filename = 'Extraction'
          const data: Blob = new Blob([excelBuffer], { type: EXCEL_TYPE })
          this.appService.alert.next({
            text: "Le téléchargement va démarrer : cette opération peut, selon votre ordinateur, prendre plusieurs secondes. Merci de patienter jusqu'à l'ouverture de votre fenêtre de téléchargement.",
          })
          FileSaver.saveAs(data, filename + EXCEL_EXTENSION)
        })
      })
  }
}
