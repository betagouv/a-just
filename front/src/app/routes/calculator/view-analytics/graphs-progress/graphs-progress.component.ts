import { Component, HostBinding, inject, Input, OnChanges, SimpleChanges } from '@angular/core'
import { SpeedometerComponent } from '../../../../components/speedometer/speedometer.component'
import { MainClass } from '../../../../libs/main-class'
import { UserService } from '../../../../services/user/user.service'

/**
 * Composant d'une jauge de progression
 */

@Component({
  selector: 'aj-graphs-progress',
  standalone: true,
  imports: [SpeedometerComponent],
  templateUrl: './graphs-progress.component.html',
  styleUrls: ['./graphs-progress.component.scss'],
})
export class GraphsProgressComponent extends MainClass implements OnChanges {
  /**
   * Service de gestion des utilisateurs
   */
  userService = inject(UserService)

  /**
   * Default ref name
   */
  @Input() referentielName: string = ''
  /**
   * Percent progress
   */
  @Input() percent: number | null = null
  /**
   * Style background
   */
  @HostBinding('style.background') background: string = ''

  /**
   * Constructor
   */
  constructor() {
    super()
  }

  /**
   * Changement des propriétés
   * @param changes
   */
  ngOnChanges(changes: SimpleChanges) {
    if (this.referentielName) {
      this.background = `linear-gradient(38deg, ${this.userService.referentielMappingColorByInterface(this.referentielName, 0.25)} 5%, #fff 117%)`
    }
  }
}
