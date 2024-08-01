import { Component, HostBinding, Input, OnChanges, SimpleChanges } from '@angular/core'
import { MainClass } from 'src/app/libs/main-class'
import { UserService } from 'src/app/services/user/user.service'

/**
 * Composant de la page en vue analytique
 */

@Component({
  selector: 'aj-graphs-numbers',
  templateUrl: './graphs-numbers.component.html',
  styleUrls: ['./graphs-numbers.component.scss'],
})
export class GraphsNumbersComponent extends MainClass implements OnChanges {
  /**
   * Default ref name
   */
  @Input() referentielName: string = ''
  /**
   * Title
   */
  @Input() title: string = ''
  /**
   * Sub title
   */
  @Input() subTitle: string = ''
  /**
   * White mode
   */
  @Input() isWhite: boolean = false
  /**
   * Style background
   */
  @HostBinding('style.background-color') backgroundColor: string = ''

  /**
   * Constructor
   */
  constructor(
    public userService: UserService,
  ) {
    super()
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.referentielName) {
      this.backgroundColor = this.referentielMappingColor(this.referentielName, this.isWhite ? 1 : 0.25)
    }
  }
}
