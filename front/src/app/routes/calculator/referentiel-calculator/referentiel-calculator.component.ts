import { Component, HostBinding, Input, OnInit } from '@angular/core'
import { CALCULATOR_OPEN_CONTENTIEUX } from 'src/app/constants/log-codes'
import { CalculatorInterface } from 'src/app/interfaces/calculator'
import { MainClass } from 'src/app/libs/main-class'
import { ActivitiesService } from 'src/app/services/activities/activities.service'
import { CalculatorService } from 'src/app/services/calculator/calculator.service'
import { KPIService } from 'src/app/services/kpi/kpi.service'
import { ReferentielService } from 'src/app/services/referentiel/referentiel.service'
import { UserService } from 'src/app/services/user/user.service'
import { month } from 'src/app/utils/dates'
import {
  userCanViewContractuel,
  userCanViewGreffier,
  userCanViewMagistrat,
} from 'src/app/utils/user'

/**
 * Composant d'une ligne du calculateur
 */

@Component({
  selector: 'aj-referentiel-calculator',
  templateUrl: './referentiel-calculator.component.html',
  styleUrls: ['./referentiel-calculator.component.scss'],
})
export class ReferentielCalculatorComponent extends MainClass {
  /**
   * Un item de la liste du calculateur
   */
  @Input() calculator: CalculatorInterface | null = null
  /**
   * Champ qui est trié, purement visuel
   */
  @Input() sortBy: string = ''
  /**
   * Type de catégorie choisie
   */
  @Input() categorySelected: string = ''
  /**
   * Affiche ou non les enfants de force
   */
  @Input() forceToShowChildren: boolean = false
  /**
   * Derniere date de donnée d'activité disponible
   */
  @Input() maxDateSelectionDate: Date | null = null
  /**
   * Connexion au css pour forcer l'affichage des enfants
   */
  @HostBinding('class.show-children') showChildren: boolean =
    (this.calculator && this.calculator.childIsVisible) || false
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
   * Constructor
   */
  constructor(
    public userService: UserService,
    private referentielService: ReferentielService,
    private calculatorService: CalculatorService,
    private activitiesService: ActivitiesService,
    private kpiService:KPIService
  ) {
    super()

    if (this.maxDateSelectionDate === null) {

      this.activitiesService.getLastMonthActivities().then((date) => {
        if (date === null) {
          date = new Date()
        }
        date = new Date(date ? date : '')
        const max = month(date, 0, 'lastday')
        this.maxDateSelectionDate = max
      })

    }

    this.watch(
      this.userService.user.subscribe((u) => {
        this.canViewMagistrat = userCanViewMagistrat(u)
        this.canViewGreffier = userCanViewGreffier(u)
        this.canViewContractuel = userCanViewContractuel(u)
      })
    )
  }

  /**
   * Suppresion des observables lors de la suppression du composant
   */
  ngOnDestroy() {
    this.watcherDestroy()
  }

  /**
   * Switch la visibilité des enfants
   */
  onToggleChildren() {
    if (this.calculator) {
      this.showChildren = !this.showChildren
      this.calculator.childIsVisible = this.showChildren
    }
    if(this.showChildren===true)
      this.kpiService.register(CALCULATOR_OPEN_CONTENTIEUX, this.calculator?.contentieux.label+'')
  }

  /**
   * Id contentieux soutien
   */
  isSoutien(id: number) {
    return this.referentielService.idsSoutien.indexOf(id) !== -1
  }

  /**
   * Troncage valeur numérique
   */
  trunc(value: number) {
    return Math.trunc(value * 100000) / 100000
  }
  /**
   * Indique si la date de fin selectionnée est dans le passé
   */
  checkPastDate() {
    return this.calculatorService.dateStop.value! <= (this.maxDateSelectionDate || new Date())
  }

  /**
  * Récuperer le type de l'app
  */
  getInterfaceType() {
    return this.userService.interfaceType === 1
  }

  /**
 * Mapping des noms de contentieux selon l'interface
 * @param label 
 * @returns 
 */
  referentielMappingNameByInterface(label: string) {
    if (this.getInterfaceType() === true)
      return this.referentielCAMappingName(label)
    else return this.referentielMappingName(label)
  }

}
