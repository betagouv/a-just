import { Component, HostBinding, Input, OnChanges, OnInit, SimpleChange, SimpleChanges } from '@angular/core'
import { MainClass } from 'src/app/libs/main-class'
import { UserService } from 'src/app/services/user/user.service'

/**
 * Composant de la page en vue analytique
 */

@Component({
  selector: 'aj-graphs-verticals-lines',
  templateUrl: './graphs-verticals-lines.component.html',
  styleUrls: ['./graphs-verticals-lines.component.scss'],
})
export class GraphsVerticalsLinesComponent extends MainClass implements OnChanges {
  /**
   * Default ref name
   */
  @Input() referentielName: string = ''
  /**
   * Values
   */
  @Input() values: number[] = []
  /**
   * Max values
   */
  @Input() maxValue: number = 100
  /**
   * Style background
   */
  @HostBinding('style.background') background: string = ''

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
      this.background = `linear-gradient(${this.referentielMappingColor(this.referentielName, 0.25)}, #ffffff)`
    }
  }

  /**
   * Suppresion des observables lors de la suppression du composant
   */
  ngOnDestroy() {
    this.watcherDestroy()
  }
}
