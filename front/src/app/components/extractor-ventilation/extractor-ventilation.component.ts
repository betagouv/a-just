import { Component, OnInit } from '@angular/core';
import { MainClass } from 'src/app/libs/main-class';
import { AppService } from 'src/app/services/app/app.service';
import { ExcelService } from 'src/app/services/excel/excel.service';
import { UserService } from 'src/app/services/user/user.service';
import { userCanViewContractuel, userCanViewGreffier, userCanViewMagistrat } from 'src/app/utils/user';

@Component({
  selector: 'aj-extractor-ventilation',
  templateUrl: './extractor-ventilation.component.html',
  styleUrls: ['./extractor-ventilation.component.scss']
})
export class ExtractorVentilationComponent extends MainClass {
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
          this.categories.push({ id: 1, label: 'tous', value: 'Tous' })
        if (this.canViewMagistrat)
          this.categories.push({ id: 2, label: 'Magistrat', value: 'Siège' })
        if (this.canViewContractuel)
          this.categories.push({ id: 3, label: 'Greffe', value: 'Greffe' })
        if (this.canViewGreffier)
          this.categories.push({ id: 4, label: 'Autour du magistrat', value: 'Equipe autour du magistrat' })
      })
    )
  }

  /**
   * Export de fichier excel
   */
  export() {
    this.appService.alert.next({
      text: "Le téléchargement va démarrer : cette opération peut, selon votre ordinateur, prendre plusieurs secondes. Merci de patienter jusqu'à l'ouverture de votre fenêtre de téléchargement.",
    })
    this.excelService.exportExcel()
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
    console.log(event)
    this.selectedCategorieId = category?.label
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

  async onSendActivity(form: any) {
    const file = form.file.files[0];

    if (!file) {
      alert('Vous devez saisir une fichier !');
      return;
    }

    this.excelService.modifyExcel(file)

  }

}
