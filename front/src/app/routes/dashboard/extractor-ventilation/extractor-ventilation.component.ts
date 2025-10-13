import { Component, AfterViewInit } from '@angular/core'
import { DateSelectComponent } from '../../../components/date-select/date-select.component'
import { SelectComponent } from '../../../components/select/select.component'
import { MainClass } from '../../../libs/main-class'
import { ExcelService } from '../../../services/excel/excel.service'
import { UserService } from '../../../services/user/user.service'
import { AppService } from '../../../services/app/app.service'
import { userCanViewContractuel, userCanViewGreffier, userCanViewMagistrat } from '../../../utils/user'
import { MatIconModule } from '@angular/material/icon'

@Component({
  selector: 'aj-extractor-ventilation',
  standalone: true,
  imports: [DateSelectComponent, SelectComponent, MatIconModule],
  templateUrl: './extractor-ventilation.component.html',
  styleUrls: ['./extractor-ventilation.component.scss'],
})
export class ExtractorVentilationComponent extends MainClass implements AfterViewInit {
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
  selectedCategorieId: undefined | Array<string> = undefined
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
   * Constructeur
   * @param excelService
   */
  constructor(private excelService: ExcelService, private userService: UserService, private appService: AppService) {
    super()

    this.watch(
      this.userService.user.subscribe((u) => {
        this.canViewMagistrat = userCanViewMagistrat(u)
        this.canViewGreffier = userCanViewGreffier(u)
        this.canViewContractuel = userCanViewContractuel(u)
        /**
                if (
                  this.canViewMagistrat &&
                  this.canViewGreffier &&
                  this.canViewContractuel
                )
                  this.categories.push({ id: 1, label: 'tous', value: 'Tous' })
                   */
        if (this.canViewMagistrat) this.categories.push({ id: 2, label: 'Magistrat', value: 'Siège' })
        if (this.canViewContractuel)
          this.categories.push({
            id: 4,
            label: 'Autour du magistrat',
            value: 'Equipe autour du magistrat',
          })
        if (this.canViewGreffier) this.categories.push({ id: 3, label: 'Greffe', value: 'Greffe' })
      }),
    )
  }

  /**
   * E2E bridge: expose helpers on window to set dates without interacting with the calendar UI.
   * Only registered when running under Cypress (window.Cypress) to avoid polluting prod runtime.
   */
  ngAfterViewInit(): void {
    try {
      const w: any = (window as any)
      if (w && (w.Cypress || w.__AJ_E2E)) {
        // Set both dates at once (ISO string or Date accepted)
        w.__aj_setEffectifDates = (start: string | Date, stop: string | Date) => {
          try {
            const d1 = start instanceof Date ? start : new Date(start)
            const d2 = stop instanceof Date ? stop : new Date(stop)
            this.selectDate('start', d1)
            this.selectDate('stop', d2)
          } catch {}
        }
        // Set start date only
        w.__aj_setEffectifStart = (start: string | Date) => {
          try {
            const d1 = start instanceof Date ? start : new Date(start)
            this.selectDate('start', d1)
          } catch {}
        }
        // Set stop date only
        w.__aj_setEffectifStop = (stop: string | Date) => {
          try {
            const d2 = stop instanceof Date ? stop : new Date(stop)
            this.selectDate('stop', d2)
          } catch {}
        }
      }
    } catch {}
  }

  /**
   * Export de fichier excel
   */
  export() {
    if (this.selectedCategorieId?.length) {
      this.appService.alert.next({
        text: "Le téléchargement va démarrer : cette opération peut, selon votre ordinateur, prendre plusieurs secondes. Merci de patienter jusqu'à l'ouverture de votre fenêtre de téléchargement.",
      })

      setTimeout(() => {
        this.appService.alert.next(null)
      }, 5000)
      this.excelService.isLoading.next(true)
      this.excelService.exportExcel()
    }
  }

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
   * Selecteur de categorie
   * @param event évenement click
   */
  updateCategory(event: any) {
    const category = new Array()
    if (event !== null)
      event.map((x: any) => {
        category.push(this.categories.find((category) => category.id === x))
      })
    this.selectedCategorieId = category?.map((x) => x.label.toLowerCase())

    this.checkValidity()
    if (this.selectedCategorieId.length) {
      this.excelService.selectedCategory.next(this.selectedCategorieId)
    }
  }

  /**
   * Vérifie si tous les paramètres sont bien selectionnés
   */
  checkValidity() {
    if (this.dateStart !== null && this.dateStop !== null && this.selectedCategorieId?.length) this.classSelected = ''
    else this.classSelected = 'disabled'
  }

  async onSendActivity(form: any) {
    const file = form.file.files[0]

    if (!file) {
      alert('Vous devez saisir une fichier !')
      return
    }

    this.excelService.modifyExcel(file)
  }

  /**
   * Ajout d'un nombre de mois à une date
   * @param date
   * @param months
   * @returns
   */
  override addMonthsToDate(date: Date | null, months: number): Date | null {
    return super.addMonthsToDate(date, months)
  }
}
