import { Component, HostBinding, Input, OnChanges, SimpleChanges } from '@angular/core'
import { MainClass } from 'src/app/libs/main-class'
import { UserService } from 'src/app/services/user/user.service'

/**
 * Composant d'une jauge de progression
 */

@Component({
  selector: 'aj-graphs-progress',
  templateUrl: './graphs-progress.component.html',
  styleUrls: ['./graphs-progress.component.scss'],
})
export class GraphsProgressComponent extends MainClass implements OnChanges {
  /**
   * Default ref name
   */
  @Input() referentielName: string = ''
  /**
   * Percent progress
   */
  @Input() percent: number = 0
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
      this.background = `linear-gradient(38deg, ${this.referentielMappingColor(this.referentielName, 0.25)} 5%, #fff 117%)`
    }
  }
}
