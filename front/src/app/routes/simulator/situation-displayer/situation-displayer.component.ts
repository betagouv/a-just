import { Component, Input } from '@angular/core'
import { MainClass } from '../../../libs/main-class'
import { FormsModule } from '@angular/forms'
import { SimulatorService } from '../../../services/simulator/simulator.service'
import { UserService } from '../../../services/user/user.service'
import { userCanViewContractuel, userCanViewGreffier, userCanViewMagistrat } from '../../../utils/user'
import { SimulatorInterface } from '../../../interfaces/simulator'
import { SimulationInterface } from '../../../interfaces/simulation'
import { MatTooltipModule } from '@angular/material/tooltip'
import { fixDecimal } from '../../../utils/numbers'

/**
 * Composant de visualisation de la situation
 */
@Component({
  selector: 'aj-situation-displayer',
  standalone: true,
  imports: [FormsModule, MatTooltipModule],
  templateUrl: './situation-displayer.component.html',
  styleUrls: ['./situation-displayer.component.scss'],
})
export class SituationDisplayerComponent extends MainClass {
  /**
   * Catégorie selectionnée
   */
  @Input() categorySelected: string | null = null

  /**
   * Situation
   */
  @Input() situation: any = null

  /**
   * Header
   */
  @Input() header: any = {
    /**
     * Type
     */
    type: '',
    /**
     * Label
     */
    label: '',
    /**
     * Header color class
     */
    headerColorClass: '',
    /**
     * Element color class
     */
    elementColorClass: '',
  }

  /**
   * Peux voir l'interface magistrat
   */
  canViewMagistrat: any = null
  /**
   * Peux voir l'interface greffier
   */
  canViewGreffier: any = null
  /**
   * Peux voir l'interface contractuel
   */
  canViewContractuel: any = null

  /**
   * Constructeur
   * @param simulatorService
   * @param userService
   */
  constructor(
    private simulatorService: SimulatorService,
    private userService: UserService,
  ) {
    super()
    this.userService.user.subscribe((u) => {
      this.canViewMagistrat = userCanViewMagistrat(u)
      this.canViewGreffier = userCanViewGreffier(u)
      this.canViewContractuel = userCanViewContractuel(u)
    })
  }

  /**
   * Récupère la valeur d'un champs à afficher
   * @param param paramètre à afficher
   * @param data simulation
   * @param initialValue valeur initial
   * @param toCompute valeur calculé ou non
   * @returns valeur à afficher
   */
  getFieldValue(param: string, data: SimulatorInterface | SimulationInterface | null, initialValue = false, toCompute = false): string {
    if (this.simulatorService.situationActuelle.getValue() !== null && this.simulatorService.contentieuOrSubContentieuId.getValue()?.length) {
      return this.simulatorService.getFieldValue(param, data, initialValue, toCompute)
    }
    return ''
  }

  /**
   * Troncage valeur numérique
   */
  trunc(param: string, data: SimulatorInterface | SimulationInterface | null, initialValue = false, toCompute = false) {
    return fixDecimal(parseFloat(this.getFieldValue(param, data, initialValue, toCompute)), 100000)
  }
}
