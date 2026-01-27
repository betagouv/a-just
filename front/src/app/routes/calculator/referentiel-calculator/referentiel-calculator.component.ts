import { CommonModule, DecimalPipe } from '@angular/common';
import { AfterViewInit, Component, HostBinding, Input } from '@angular/core'
import { SpeedometerComponent } from '../../../components/speedometer/speedometer.component'
import { TooltipsComponent } from '../../../components/tooltips/tooltips.component'
import { MainClass } from '../../../libs/main-class'
import { CalculatorInterface } from '../../../interfaces/calculator'
import { OPACITY_20 } from '../../../constants/colors'
import { UserService } from '../../../services/user/user.service'
import { ReferentielService } from '../../../services/referentiel/referentiel.service'
import { CalculatorService } from '../../../services/calculator/calculator.service'
import { ActivitiesService } from '../../../services/activities/activities.service'
import { KPIService } from '../../../services/kpi/kpi.service'
import { userCanViewContractuel, userCanViewGreffier, userCanViewMagistrat } from '../../../utils/user'
import { month } from '../../../utils/dates'
import { CALCULATOR_OPEN_CONTENTIEUX } from '../../../constants/log-codes'
import { MatIconModule } from '@angular/material/icon'
import { MatTooltipModule } from '@angular/material/tooltip'

/**
 * Composant d'une ligne du calculateur
 */

@Component({
  standalone: true,
  imports: [CommonModule, SpeedometerComponent, ReferentielCalculatorComponent, TooltipsComponent, MatIconModule, MatTooltipModule, DecimalPipe],
  selector: 'aj-referentiel-calculator',
  templateUrl: './referentiel-calculator.component.html',
  styleUrls: ['./referentiel-calculator.component.scss'],
})
export class ReferentielCalculatorComponent extends MainClass implements AfterViewInit {
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
   * Catégorie filtrée
   */
  @Input() categoryFiltered: {label: string, value: string, categoryId: number, accessId: number}[] = []
  /**
   * Catégorie sélectionnée
   */
  @Input() categoryIdSelected: number | null = null
  /**
   * Connexion au css pour forcer l'affichage des enfants
   */
  @HostBinding('class.show-children') showChildren: boolean = (this.calculator && this.calculator.childIsVisible) || false
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
   * Opacité background des contentieux
   */
  OPACITY = OPACITY_20

  /**
   * Constructor
   */
  constructor(
    public userService: UserService,
    private referentielService: ReferentielService,
    private calculatorService: CalculatorService,
    private activitiesService: ActivitiesService,
    private kpiService: KPIService,
  ) {
    super()

    this.watch(
      this.userService.user.subscribe((u) => {
        this.canViewMagistrat = userCanViewMagistrat(u)
        this.canViewGreffier = userCanViewGreffier(u)
        this.canViewContractuel = userCanViewContractuel(u)
      }),
    )
  }

  /**
   * Suppresion des observables lors de la suppression du composant
   */
  ngOnDestroy() {
    this.watcherDestroy()
  }

  /**
   * Initialisation de valeur par défaut
   */
  ngAfterViewInit() {
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
  }
  /**
   * Switch la visibilité des enfants
   */
  onToggleChildren() {
    if (this.calculator) {
      this.showChildren = !this.showChildren
      this.calculator.childIsVisible = this.showChildren
    }
    if (this.showChildren === true) this.kpiService.register(CALCULATOR_OPEN_CONTENTIEUX, this.calculator?.contentieux.label + '')
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
   * Arrondi
   * @param value 
   * @returns 
   */
  round(value:number){
  return Math.round(value)
  }
  /**
   * Indique si la date de fin selectionnée est dans le passé
   */
  checkPastDate() {
    return this.calculatorService.dateStop.value! <= (this.maxDateSelectionDate || new Date())
  }
}
