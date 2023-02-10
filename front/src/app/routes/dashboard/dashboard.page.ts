import { Component } from '@angular/core'
import { MainClass } from 'src/app/libs/main-class'
import { ExcelService } from 'src/app/services/excel/excel.service'
import { UserService } from 'src/app/services/user/user.service'
import {
  userCanViewContractuel,
  userCanViewGreffier,
  userCanViewMagistrat,
} from 'src/app/utils/user'

/**
 * Page d'extraction
 */
@Component({
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
})
export class DashboardPage extends MainClass {
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
  constructor(
    private excelService: ExcelService,
    private userService: UserService
  ) {
    super()
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
