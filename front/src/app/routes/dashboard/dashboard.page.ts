import { AfterViewInit, Component } from '@angular/core'
import { MainClass } from 'src/app/libs/main-class'
import { ExcelService } from 'src/app/services/excel/excel.service'
/**
 * Composant Dashboard
 */
@Component({
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
})
export class DashboardPage extends MainClass implements AfterViewInit {
  ngAfterViewInit(): void {}
  constructor(private excelService: ExcelService) {
    super()
  }
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
  categories = [
    { id: 1, value: 'Tous' },
    { id: 2, value: 'Magistrat' },
    { id: 3, value: 'Contractuel' },
    { id: 4, value: 'Fonctionnaire' },
  ]
  /**
   * Categorie selectionée
   */
  selectedCategorieId: undefined | string = undefined
  /**
   * Loader
   */
  isLoading: boolean = false

  /**
   * Export de fichier excel
   */
  export() {
    this.isLoading = true
    this.excelService.exportExcel().then(() => (this.isLoading = false))
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

  /**
   * Vérifie si tous les paramètres sont bien selectionnés
   */
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
