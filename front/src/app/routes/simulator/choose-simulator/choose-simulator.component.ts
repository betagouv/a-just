import { Component, EventEmitter, HostListener, inject, Output } from '@angular/core'
import { MainClass } from '../../../libs/main-class'

import { UserService } from '../../../services/user/user.service'
import { REAFFECTATOR, SIMULATOR_DONNEES, SIMULATOR_OTHER_ACTIVITY } from '../../../constants/simulator'
import { MENU_HEIGHT, MENU_WIDTH } from '../../../constants/menu'
import { AppService } from '../../../services/app/app.service'

/**
 * Composant de choix du simulateur
 */
@Component({
  standalone: true,
  selector: 'app-choose-simulator',
  imports: [],
  templateUrl: './choose-simulator.component.html',
  styleUrls: ['./choose-simulator.component.scss'],
})
export class ChooseSimulatorComponent extends MainClass {
  /**
   * Service de l'utilisateur
   */
  userService = inject(UserService)
  /**
   * Service de l'application
   */
  appService = inject(AppService)
  /**
   * Event emitter pour le simulateur sélectionné
   */
  @Output() selectedSimulatorType: EventEmitter<string> = new EventEmitter()
  /**
   * Simulateur sélectionné
   */
  selectedSimulator: string = ''
  /**
   * Simulateur de données
   */
  SIMULATOR_DONNEES = SIMULATOR_DONNEES
  /**
   * Simulateur d'autres activités
   */
  SIMULATOR_OTHER_ACTIVITY = SIMULATOR_OTHER_ACTIVITY
  /**
   * Reaffectateur
   */
  REAFFECTATOR = REAFFECTATOR
  /**
   * Largeur du menu
   */
  MENU_WIDTH = MENU_WIDTH
  /**
   * Hauteur du menu
   */
  MENU_HEIGHT = MENU_HEIGHT
  /**
   * Mouse x
   */
  mouseX: number = 0
  /**
   * Mouse y
   */
  mouseY: number = 0

  /**
   * Mouse move
   * @param e
   * @returns
   */
  @HostListener('window:mousemove', ['$event']) mouseMove = (e: MouseEvent): any => {
    this.mouseX = e.clientX
    this.mouseY = e.clientY
  }

  /**
   * Constructeur
   */
  constructor() {
    super()
  }

  /**
   * On select
   */
  onSelect() {
    if (this.selectedSimulator) {
      this.selectedSimulatorType.emit(this.selectedSimulator)
    }
  }
}
