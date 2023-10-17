import { Component, HostBinding, Input } from '@angular/core'
import { CalculatorInterface } from 'src/app/interfaces/calculator'
import { MainClass } from 'src/app/libs/main-class'
import { CalculatorService } from 'src/app/services/calculator/calculator.service'
import { ReferentielService } from 'src/app/services/referentiel/referentiel.service'
import { UserService } from 'src/app/services/user/user.service'
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
    private userService: UserService,
    private referentielService: ReferentielService,
    private calculatorService: CalculatorService
  ) {
    super()

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
  }

  /**
   * Arrondi valeur numérique
   */
  floor(value: number) {
    return Math.floor(value)
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
}
