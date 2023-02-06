import { Component, OnInit } from '@angular/core'
import { BehaviorSubject } from 'rxjs'
import { ContentieuReferentielInterface } from 'src/app/interfaces/contentieu-referentiel'
import { HRCategoryInterface } from 'src/app/interfaces/hr-category'
import { MainClass } from 'src/app/libs/main-class'
import { AppService } from 'src/app/services/app/app.service'
import { ExcelService } from 'src/app/services/excel/excel.service'
import { ServerService } from 'src/app/services/http-server/server.service'
import { HumanResourceService } from 'src/app/services/human-resource/human-resource.service'
import { UserService } from 'src/app/services/user/user.service'
import { generalizeTimeZone } from 'src/app/utils/dates'
import {
  userCanViewContractuel,
  userCanViewGreffier,
  userCanViewMagistrat,
} from 'src/app/utils/user'

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
    private appService: AppService
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
        categoryFilter: this.selectedCategorieId || [],
      })
      .then((data) => {
        console.log(data)
      })
  }
}
