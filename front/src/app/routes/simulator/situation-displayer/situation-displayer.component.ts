import { Component, Input } from '@angular/core';
import { SimulationInterface } from 'src/app/interfaces/simulation';
import { SimulatorInterface } from 'src/app/interfaces/simulator';
import { MainClass } from 'src/app/libs/main-class';
import { SimulatorService } from 'src/app/services/simulator/simulator.service';
import { UserService } from 'src/app/services/user/user.service';
import { userCanViewContractuel, userCanViewGreffier, userCanViewMagistrat } from 'src/app/utils/user';

@Component({
  selector: 'aj-situation-displayer',
  templateUrl: './situation-displayer.component.html',
  styleUrls: ['./situation-displayer.component.scss']
})
export class SituationDisplayerComponent extends MainClass {

  @Input() categorySelected: string | null = null

  @Input() situation: any = null

  @Input() header: any = { type: '', label: '', headerColorClass: '', elementColorClass:'' }

  canViewMagistrat: any = null
  canViewGreffier: any = null
  canViewContractuel: any = null

  constructor(private simulatorService: SimulatorService, private userService: UserService) {
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
  getFieldValue(
    param: string,
    data: SimulatorInterface | SimulationInterface | null,
    initialValue = false,
    toCompute = false
  ): string {
    if (
      (this.simulatorService.situationActuelle.getValue() !== null &&
        this.simulatorService.contentieuOrSubContentieuId.getValue()?.length)
    ) {
      return this.simulatorService.getFieldValue(
        param,
        data,
        initialValue,
        toCompute
      )
    }
    return ''
  }

  /**
  * Troncage valeur numérique
  */
  trunc(param: string,
    data: SimulatorInterface | SimulationInterface | null,
    initialValue = false,
    toCompute = false) {
    return Math.trunc(Number(this.getFieldValue(param, data, initialValue, toCompute)) * 100000) / 100000
  }

}
