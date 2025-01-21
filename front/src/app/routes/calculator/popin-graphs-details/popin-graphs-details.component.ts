import { CommonModule } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { MainClass } from '../../../libs/main-class';
import { ContentieuReferentielInterface } from '../../../interfaces/contentieu-referentiel';
import { OPACITY_20 } from '../../../constants/colors';
import { UserService } from '../../../services/user/user.service';
import { PopupComponent } from '../../../components/popup/popup.component';
import { HumanResourceService } from '../../../services/human-resource/human-resource.service';
import { CalculatorService } from '../../../services/calculator/calculator.service';

/**
 * Composant de la popin qui affiche en gros les détails les données d'une comparaison
 */

@Component({
  standalone: true,
  imports: [CommonModule, PopupComponent],
  selector: 'aj-popin-graphs-details',
  templateUrl: './popin-graphs-details.component.html',
  styleUrls: ['./popin-graphs-details.component.scss'],
})
export class PopinGraphsDetailsComponent extends MainClass {
  userService = inject(UserService);
  humanResourceService = inject(HumanResourceService);
  calculatorService = inject(CalculatorService);
  /**
   * Comparaison de la popin
   */
  @Input() compareAtString: string = '';
  /**
   * Date de début de comparaison
   */
  @Input() dateStart: Date | null = null;
  /**
   * Date de fin de comparaison
   */
  @Input() dateStop: Date | null = null;
  /**
   * Date de début comparaison
   */
  @Input() optionDateStart: Date | null = null;
  /**
   * Date de fin de comparaison
   */
  @Input() optionDateStop: Date | null = null;
  /**
   * Opacité background des contentieux
   */
  OPACITY = OPACITY_20;

  /**
   * Constructor
   */
  constructor() {
    super();
  }

  ngOnInit() {
    this.onLoadDatas();
  }

  selectReferentiel(ref: ContentieuReferentielInterface) {
    this.calculatorService.selectedRefGraphDetail = ref.id;
    this.onLoadDatas();
  }

  async onLoadDatas() {
    console.log(
      this.dateStart,
      this.dateStop,
      this.calculatorService.selectedRefGraphDetail,
      this.calculatorService.showGraphDetailType,
      this.optionDateStart,
      this.optionDateStop
    );

    if (
      this.calculatorService.selectedRefGraphDetail &&
      this.calculatorService.showGraphDetailType
    ) {
      const firstValues = await this.calculatorService.rangeValues(
        +this.calculatorService.selectedRefGraphDetail,
        this.calculatorService.showGraphDetailType
      );

      const secondValues = await this.calculatorService.rangeValues(
        +this.calculatorService.selectedRefGraphDetail,
        this.calculatorService.showGraphDetailType,
        this.optionDateStart,
        this.optionDateStop
      );

      // Attention, je n'ai pas encore faire le DTES et le temps moyen mais les autres c'est bon

      console.log(firstValues, secondValues);
    }
  }
}
