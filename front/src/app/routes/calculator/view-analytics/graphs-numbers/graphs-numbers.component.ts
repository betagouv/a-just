import { CommonModule } from '@angular/common';
import {
  Component,
  HostBinding,
  inject,
  Input,
  OnChanges,
} from '@angular/core';
import { TooltipsComponent } from '../../../../components/tooltips/tooltips.component';
import { MainClass } from '../../../../libs/main-class';
import { UserService } from '../../../../services/user/user.service';
import { OPACITY_20 } from '../../../../constants/colors';

/**
 * Composant de la page en vue analytique
 */

@Component({
  selector: 'aj-graphs-numbers',
  standalone: true,
  imports: [CommonModule, TooltipsComponent],
  templateUrl: './graphs-numbers.component.html',
  styleUrls: ['./graphs-numbers.component.scss'],
})
export class GraphsNumbersComponent extends MainClass implements OnChanges {
  userService = inject(UserService);
  /**
   * Default ref name
   */
  @Input() referentielName: string = '';
  /**
   * Title
   */
  @Input() title: string = '';
  /**
   * Sub title
   */
  @Input() subTitle?: string;
  /**
   * White mode
   */
  @Input() isWhite: boolean = false;
  /**
   * Show indicator arrow
   */
  @Input() showArrow: boolean = false;
  /**
   * type
   */
  @Input() type: string = '';
  /**
   * Show transparent class
   */
  @Input() @HostBinding('class.is-transparent') isTransparent: boolean = false;
  /**
   * Style background
   */
  @HostBinding('style.background-color') backgroundColor: string = '';
  /**
   * Style background
   */
  @HostBinding('style.border-color') borderColor: string = '';

  /**
   * Constructor
   */
  constructor() {
    super();
  }

  ngOnChanges() {
    if (this.referentielName) {
      if (!this.isTransparent) {
        this.backgroundColor =
          this.userService.referentielMappingColorByInterface(
            this.referentielName,
            this.isWhite ? 1 : OPACITY_20
          );
      } else {
        this.borderColor = this.userService.referentielMappingColorByInterface(
          this.referentielName,
          OPACITY_20
        );
      }
    }
  }

  getArrowSide(title: string) {
    return ('' + title)[0] === '-';
  }

  getArrowColor(title: string) {
    if (
      [
        'ETPT Siège',
        'ETPT Greffe',
        'ETPT EAM',
        'Sorties',
        'Taux de couverture',
      ].includes(this.type)
    )
      return !(('' + title)[0] === '-');
    else return ('' + title)[0] === '-';
  }
}
